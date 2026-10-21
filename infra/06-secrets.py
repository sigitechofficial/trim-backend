#!/usr/bin/env python3
"""Step 6 of the AWS setup: put Trim's settings into AWS Parameter Store as
encrypted SecureString values under /trim/prod/<NAME>.

The values come from the Mac clipboard and go straight to AWS. They are never
printed, never written to the repo, and the clipboard is cleared at the end.
Each value passes through a private temp file (mode 600) that is deleted right
after its upload, because the AWS CLI only reads JSON input from a real file.

  ./06-secrets.py env              clipboard = the whole cPanel .env text
  ./06-secrets.py file NAME        clipboard = a whole file (e.g. firebase.json),
                                   stored base64-encoded as NAME
  ./06-secrets.py text NAME        clipboard = one value stored as is (e.g. the
                                   text of an Apple .p8 key)
  OVERWRITE=1 ./06-secrets.py ...  replace values that already exist

Cost: free (standard parameters, AWS-managed encryption key).
"""
import base64, json, os, subprocess, sys, tempfile

PREFIX = "/trim/prod/"
# Set by us in the ECS task, or only meaningful on the cPanel server.
SKIP = {"NODE_ENV", "PORT", "APEX_DOCROOT", "COUK_DOCROOT",
        "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT", "DB_DIALECT"}
ENV = dict(os.environ, AWS_PROFILE="trim", AWS_REGION="eu-west-2")


def clipboard():
    return subprocess.run(["pbpaste"], capture_output=True, text=True, check=True).stdout


def parse_env(text):
    """dotenv-style KEY=VALUE parser: comments, export, quotes, multi-line quotes."""
    out, lines, i = {}, text.splitlines(), 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, val = line.split("=", 1)
        key, val = key.strip(), val.strip()
        if val[:1] in ("'", '"'):
            q = val[0]
            body = val[1:]
            while not body.rstrip().endswith(q) and i < len(lines):
                body += "\n" + lines[i]
                i += 1
            body = body.rstrip()
            body = body[:-1] if body.endswith(q) else body
            val = body.replace("\\n", "\n") if q == '"' else body
        else:
            val = val.split(" #", 1)[0].strip()
        out[key] = val
    return out


def exists(name):
    r = subprocess.run(["aws", "ssm", "get-parameter", "--name", name,
                        "--query", "Parameter.Name", "--output", "text"],
                       capture_output=True, text=True, env=ENV)
    return r.returncode == 0


def put(key, value):
    name = PREFIX + key
    overwrite = os.environ.get("OVERWRITE") == "1"
    if exists(name) and not overwrite:
        return "kept (already in AWS)"
    body = {"Name": name, "Value": value, "Type": "SecureString",
            "Tier": "Intelligent-Tiering", "Overwrite": overwrite}
    if not overwrite:
        body["Tags"] = [{"Key": "project", "Value": "trim-aws"}]
    fd, path = tempfile.mkstemp(prefix="trim-param-", suffix=".json")
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w") as f:
            json.dump(body, f)
        r = subprocess.run(["aws", "ssm", "put-parameter", "--cli-input-json",
                            "file://" + path, "--query", "Version", "--output", "text"],
                           capture_output=True, text=True, env=ENV)
    finally:
        os.remove(path)
    if r.returncode != 0:
        # The AWS error text never contains the value; show only its last line.
        return "FAILED: " + (r.stderr.strip().splitlines() or ["?"])[-1]
    return "stored (version %s)" % r.stdout.strip()


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("env", "file", "text"):
        sys.exit(__doc__)
    text = clipboard()
    if not text.strip():
        sys.exit("The clipboard is empty. Copy the text first.")
    if sys.argv[1] in ("file", "text"):
        if len(sys.argv) != 3:
            sys.exit("Usage: ./06-secrets.py %s NAME" % sys.argv[1])
        value = base64.b64encode(text.encode()).decode() if sys.argv[1] == "file" else text.strip()
        items = {sys.argv[2]: value}
    else:
        items = parse_env(text)
        if not items:
            sys.exit("No KEY=VALUE lines found in the clipboard.")
    for key in sorted(items):
        if key in SKIP:
            print("%-40s skipped (set in the ECS task instead)" % key)
        elif key.endswith("_PATH"):
            print("%-40s skipped (a file path on cPanel; handled separately)" % key)
        elif items[key] == "":
            print("%-40s skipped (empty)" % key)
        else:
            print("%-40s %s" % (key, put(key, items[key])))
    subprocess.run(["pbcopy"], input="", text=True)
    print("\nClipboard cleared. Values were not shown anywhere.")


if __name__ == "__main__":
    main()

# Complete List of All Notification Texts in TRIM Backend

This document contains all notification messages sent by the Trim backend application, organized by recipient type and event.

## 🔍 QUICK REFERENCE

- **📱 CUSTOMER NOTIFICATIONS** - Sent to customers (15 types)
- **🏪 SALON NOTIFICATIONS** - Sent to salon owners (13 types)
- **👨‍💼 EMPLOYEE NOTIFICATIONS** - Sent to salon employees (4 types)
- **🔔 ADMIN NOTIFICATIONS** - Admin/system notifications (2 types)

> **Important:** Reminder notifications (24h and 2h) have different formats for customers vs salons:
> - **Customer reminders:** Include date and time only (NO service names)
> - **Salon reminders:** Include date, time, AND service names

---

## 📱 CUSTOMER NOTIFICATIONS

> **Note:** Customer reminder notifications (24h and 2h) do NOT include service names, only date and time.

### 1. Booking Confirmed
- **Title:** `Booking confirmed`
- **Body:** `Your booking with [SALON_NAME] on [DATE_TIME] has been confirmed.`
- **File:** `controllers/eventDrivenCommunication/appointmentConfirm.js`
- **Trigger:** When booking is confirmed

### 2. Booking Cancelled (by Salon)
- **Title:** `Booking cancelled`
- **Body:** `Your booking on [DATE_TIME] has been cancelled.`
- **File:** `controllers/eventDrivenCommunication/appointmentCancel.js` (cancelBySalon)
- **Trigger:** When salon cancels booking

### 3. Booking Cancelled (by Customer)
- **Title:** `Booking cancelled`
- **Body:** `We regret to inform you that your booking on [DATE_TIME] has been cancelled.`
- **File:** `controllers/eventDrivenCommunication/appointmentCancel.js` (cancelByCustomer)
- **Trigger:** When customer cancels booking

### 4. Booking Cancelled (by Salon - Alternative)
- **Title:** `Booking Cancellation`
- **Body:** `We regret to inform you that your booking on [DATE_TIME] has been cancelled. Please contact us to reschedule.`
- **File:** `controllers/salonControllers/bookingsController.js`
- **Trigger:** When salon marks booking as cancelled

### 5. Booking Rescheduled (from Customer)
- **Title:** `Rescheduled booking`
- **Body:** `Your booking with [SALON_NAME] has been rescheduled to [DATE_TIME].`
- **File:** `controllers/eventDrivenCommunication/appointmentReschedule.js` (fromCustomerSoloEmployee, fromCustomerMultipleEmployees)
- **Trigger:** When customer reschedules booking

### 6. Booking Rescheduled (from Salon)
- **Title:** `Rescheduled booking`
- **Body:** `Your booking with [SALON_NAME] has been rescheduled to [DATE_TIME]. Please let us know if this works for you.`
- **File:** `controllers/eventDrivenCommunication/appointmentReschedule.js` (fromSalonMultipleEmployees)
- **Trigger:** When salon reschedules booking

### 7. No-Show Notification
- **Title:** `No-show notification`
- **Body:** `You seem to have missed your booking today, if this is wrong speak to the shop directly and they should be able to help.`
- **File:** `controllers/eventDrivenCommunication/appointmentNoshow.js`
- **Trigger:** When customer doesn't show up

### 8. Upcoming Booking Reminder (24 hours) - **CUSTOMER**
- **Title:** `Upcoming booking`
- **Body:** `Your booking with [SALON_OWNER_FIRST_NAME] is tomorrow [DD/MM/YY] @ [HH:mm]pm`
- **Example:** `Your booking with John is tomorrow 25/12/25 @ 5:00pm`
- **File:** `controllers/userControllers/customerController.js` (sendReminder)
- **Trigger:** 24 hours before appointment
- **Recipient:** Customer

### 9. Upcoming Booking Reminder (2 hours) - **CUSTOMER**
- **Title:** `Upcoming booking`
- **Body:** `Your booking with [SALON_OWNER_FIRST_NAME] is in about 2 hours [DD/MM/YY] @ [HH:mm]pm`
- **Example:** `Your booking with John is in about 2 hours 25/12/25 @ 3:00pm`
- **File:** `controllers/userControllers/customerController.js` (sendReminder)
- **Trigger:** 2 hours before appointment
- **Recipient:** Customer

### 10. Review Request (Cash Payment)
- **Title:** `Review`
- **Body:** `You can leave a review for your booking to let others know about your experience.`
- **File:** `controllers/eventDrivenCommunication/appointmentCheckout.js` (cash)
- **Trigger:** After cash payment checkout

### 11. Review Request (Online Payment)
- **Title:** `Review`
- **Body:** `You can leave a review for your booking to let others know about your experience.`
- **File:** `controllers/eventDrivenCommunication/appointmentCheckout.js` (online)
- **Trigger:** After online payment checkout

### 12. Thank You for Tipping
- **Title:** `Thank you for tipping`
- **Body:** `Thank you for your generous tip. We greatly appreciate your support!`
- **File:** `controllers/eventDrivenCommunication/appointmentCheckout.js` (cash, online)
- **Trigger:** When customer adds tip (both cash and online)

### 13. Shop Reply to Feedback
- **Title:** `Shop reply`
- **Body:** `[REPLY_TEXT]. From [SALON_NAME]`
- **File:** `controllers/salonControllers/salonController.js`
- **Trigger:** When salon replies to customer feedback

### 14. New Coupon Available (Bulk)
- **Title:** `New Coupon Available!`
- **Body:** `[SALON_NAME] has a new coupon "[PROMO_CODE]" with [VALUE]% off! Valid until [DATE].`
- **File:** `controllers/eventDrivenCommunication/couponNotification.js` (sendCouponNotificationToCustomers)
- **Trigger:** When salon creates new coupon

### 15. New Coupon Available (Individual)
- **Title:** `🎉 New Coupon Available!`
- **Body:** `[SALON_NAME] has a new coupon "[PROMO_CODE]" with [VALUE]% off! Valid until [DATE].`
- **File:** `controllers/eventDrivenCommunication/couponNotification.js` (sendCouponNotificationToCustomer)
- **Trigger:** When coupon is sent to specific customer

---

## 🏪 SALON NOTIFICATIONS

> **Note:** Salon reminder notifications (24h and 2h) include service names in the format "for a [ServiceName]" or "for a [Service1] and [Service2]".

### 1. New Booking - **SALON**
- **Title:** `New booking`
- **Body:** `[CUSTOMER_FULL_NAME] has booked [DATE_TIME] for [SERVICE_NAME(s)].`
- **Example:** `John Doe has booked 25/12/2025, 5:00 PM for Hair cut.`
- **Example (multiple):** `John Doe has booked 25/12/2025, 5:00 PM for Hair cut and Beard trim.`
- **File:** `controllers/eventDrivenCommunication/appointmentConfirm.js`
- **Trigger:** When new booking is created
- **Recipient:** Salon

### 2. Booking Cancellation (by Customer)
- **Title:** `Booking cancellation`
- **Body:** `[CUSTOMER_FULL_NAME] has cancelled their booking on [DATE_TIME].`
- **File:** `controllers/eventDrivenCommunication/appointmentCancel.js` (cancelByCustomer, cancelBySalon)
- **Trigger:** When customer cancels booking

### 3. Booking Cancellation Alert (by Salon)
- **Title:** `Booking Cancellation Alert`
- **Body:** `The booking with [CUSTOMER_FULL_NAME] on [DATE_TIME] has been cancelled.`
- **File:** `controllers/salonControllers/bookingsController.js`
- **Trigger:** When salon marks booking as cancelled

### 4. Booking Rescheduled (by Customer)
- **Title:** `Booking rescheduled`
- **Body:** `[CUSTOMER_FULL_NAME] has rescheduled their booking to [DATE_TIME].`
- **File:** `controllers/eventDrivenCommunication/appointmentReschedule.js` (fromCustomerSoloEmployee, fromCustomerMultipleEmployees, fromSalonMultipleEmployees)
- **Trigger:** When customer reschedules booking

### 5. No-Show
- **Title:** `No-show`
- **Body:** `[CUSTOMER_FULL_NAME] did not show up for their booking on [DATE_TIME].`
- **File:** `controllers/eventDrivenCommunication/appointmentNoshow.js`
- **Trigger:** When customer doesn't show up

### 6. Upcoming Booking Reminder (24 hours) - **SALON**
- **Title:** `Upcoming booking`
- **Body:** `You have a booking with [CUSTOMER_FIRST_NAME] tomorrow at [HH:mm]pm on [DD/MM/YY] for a [SERVICE_NAME(s)]`
- **Example:** `You have a booking with Test tomorrow at 5:00pm on 25/12/25 for a Hair cut`
- **Example (multiple services):** `You have a booking with Test tomorrow at 3:59pm on 25/12/25 for a kids cut and Hkj`
- **File:** `controllers/userControllers/customerController.js` (sendReminder)
- **Trigger:** 24 hours before appointment
- **Recipient:** Salon

### 7. Upcoming Booking Reminder (2 hours) - **SALON**
- **Title:** `Upcoming booking`
- **Body:** `You have a booking with [CUSTOMER_FIRST_NAME] at [HH:mm]pm on [DD/MM/YY] for a [SERVICE_NAME(s)]`
- **Example:** `You have a booking with Test at 6:04pm on 24/12/25 for a Hair cut`
- **Example (multiple services):** `You have a booking with Test at 6:04pm on 24/12/25 for a kids cut and Hkj`
- **File:** `controllers/userControllers/customerController.js` (sendReminder)
- **Trigger:** 2 hours before appointment
- **Recipient:** Salon

### 8. Payment Received (Cash)
- **Title:** `Payment received`
- **Body:** `Payment of [CURRENCY][AMOUNT] received from [CUSTOMER_FULL_NAME].`
- **File:** `controllers/eventDrivenCommunication/appointmentCheckout.js` (cash)
- **Trigger:** After cash payment

### 9. Payment Received (Online)
- **Title:** `Payment received`
- **Body:** `Payment of [CURRENCY][AMOUNT] received from [CUSTOMER_FULL_NAME].`
- **File:** `controllers/eventDrivenCommunication/appointmentCheckout.js` (online)
- **Trigger:** After online payment

### 10. New Review
- **Title:** `New review`
- **Body:** `[CUSTOMER_FULL_NAME] has left a new review: [COMMENT].`
- **File:** `controllers/eventDrivenCommunication/customerFeedback.js`
- **Trigger:** When customer leaves review

### 11. Payouts Blocked
- **Title:** `Payouts Blocked`
- **Body:** `Your payouts have been temporarily paused. Please check your Stripe account for more details.`
- **File:** `controllers/salonControllers/webhookController.js`
- **Trigger:** When Stripe blocks payouts

### 12. Action Required (Stripe)
- **Title:** `Action Required`
- **Body:** `Your payout account needs additional documents.`
- **File:** `controllers/salonControllers/webhookController.js`
- **Trigger:** When Stripe requires additional documents

### 13. Account Verified (Stripe)
- **Title:** `Account Verified`
- **Body:** `Your payout account is fully verified.`
- **File:** `controllers/salonControllers/webhookController.js`
- **Trigger:** When Stripe account is fully verified

---

## 👨‍💼 EMPLOYEE NOTIFICATIONS

### 1. Booking Assigned
- **Title:** `Booking assigned`
- **Body:** `A new booking has been made by [CUSTOMER_FULL_NAME] for [DATE_TIME] for a [SERVICE_NAME]`
- **File:** `controllers/eventDrivenCommunication/appointmentConfirm.js`
- **Trigger:** When booking is assigned to employee

### 2. Booking Cancellation
- **Title:** `Booking cancellation`
- **Body:** `[CUSTOMER_FULL_NAME] has cancelled their booking on [DATE_TIME] for [SERVICE_NAME]`
- **File:** `controllers/eventDrivenCommunication/appointmentCancel.js` (cancelByCustomer)
- **Trigger:** When customer cancels booking assigned to employee

### 3. Booking Rescheduled
- **Title:** `Booking rescheduled`
- **Body:** `[CUSTOMER_FULL_NAME] has rescheduled their booking to [DATE_TIME] for [SERVICE_NAME]`
- **File:** `controllers/eventDrivenCommunication/appointmentReschedule.js` (fromCustomerSoloEmployee, fromCustomerMultipleEmployees, fromSalonMultipleEmployees)
- **Trigger:** When booking assigned to employee is rescheduled

### 4. New Review Notification
- **Title:** `New review notification`
- **Body:** `[CUSTOMER_FULL_NAME] has left a new review: [COMMENT].`
- **File:** `controllers/eventDrivenCommunication/customerFeedback.js`
- **Trigger:** When customer leaves review for employee

---

## 🔔 ADMIN NOTIFICATIONS

### 1. Custom Promotional Notification
- **Title:** `[ADMIN_DEFINED_TITLE]`
- **Body:** `[ADMIN_DEFINED_BODY]`
- **File:** `controllers/adminController/adminController.js` (throwNotifications)
- **Trigger:** Admin sends custom notification
- **Recipients:** Can be sent to customer/salon/employee/all

### 2. Test Notification
- **Title:** `TEST NOTIFICATION` (default)
- **Body:** `This is a test notification to verify your notification system is working properly!` (default)
- **File:** `controllers/userControllers/customerController.js` (notificationTesting)
- **Trigger:** Testing purposes

---

## 📊 SUMMARY BY RECIPIENT

### Customer Notifications (15 total):
1. Booking confirmed
2. Booking cancelled (by salon) - 2 variations
3. Booking cancelled (by customer)
4. Booking rescheduled (from customer)
5. Booking rescheduled (from salon)
6. No-show notification
7. Upcoming booking reminder (24h)
8. Upcoming booking reminder (2h)
9. Review request (cash)
10. Review request (online)
11. Thank you for tipping
12. Shop reply
13. New coupon available (bulk)
14. New coupon available (individual)

### Salon Notifications (13 total):
1. New booking
2. Booking cancellation (by customer) - 2 variations
3. Booking rescheduled (by customer)
4. No-show
5. Upcoming booking reminder (24h)
6. Upcoming booking reminder (2h)
7. Payment received (cash)
8. Payment received (online)
9. New review
10. Payouts blocked
11. Action required (Stripe)
12. Account verified (Stripe)

### Employee Notifications (4 total):
1. Booking assigned
2. Booking cancellation
3. Booking rescheduled
4. New review notification

---

## 📝 NOTES

- **Date Format:** 
  - Customer reminders: `DD/MM/YY @ HH:mm`pm format (e.g., "25/12/25 @ 5:00pm")
  - Salon reminders: `DD/MM/YY` for date, `HH:mm`pm for time (e.g., "25/12/25", "5:00pm")
  - Other notifications use `emailDateFormate()` which formats dates as readable strings
- **Service Names:** 
  - Included in **SALON** reminder notifications (24h and 2h) - shows service name(s) if available
  - Format: "for a [ServiceName]" for single service, "for a [Service1] and [Service2]" for multiple services
  - **NOT included** in customer reminder notifications
- **Time Format:**
  - Customer reminders: 12-hour format with am/pm (e.g., "5:00pm")
  - Salon reminders: 12-hour format with am/pm (e.g., "5:00pm")
- **Dynamic Variables:** All notifications include dynamic data like customer names, salon names, dates, times, amounts, etc.
- **File Locations:** All notification logic is primarily in `controllers/eventDrivenCommunication/` folder, except reminders which are in `controllers/userControllers/customerController.js`
- **Notification Utility:** All notifications use `ThrowNotification` from `utils/throwNotification.js`

---

**Last Updated:** Based on current codebase analysis
**Total Notifications:** 32 unique notification types across Customer, Salon, Employee, and Admin


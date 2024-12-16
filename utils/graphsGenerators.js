const Formate = require("./formater");
 
 
exports.generateFinancialGraphMonth =(appointments) => {
  let weeklyReports = {
      'Week 1': createInitialReport(),
      'Week 2': createInitialReport(),
      'Week 3': createInitialReport(),
      'Week 4': createInitialReport(),
  };

  function createInitialReport() {
      return {
          totalRevenue: 0,
          totalServicesPerformed: 0,
          newCustomers: 0,
          repeatCustomers: 0,
          totalAppointments: 0,
          serviceCounts: {},
          customerIds: new Set(), // To track new vs repeat customers
      };
  }

  const getWeekOfMonth = (date) => {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7);
  };

  appointments.forEach(appointment => {
      const date = new Date(appointment.on);
      const weekOfMonth = `Week ${getWeekOfMonth(date)}`;

      const weeklyReport = weeklyReports[weekOfMonth];
      weeklyReport.totalAppointments += 1;

      if (appointment) {
          weeklyReport.totalRevenue += parseFloat(appointment.total);

          appointment.jobs.forEach(job => {
              weeklyReport.totalServicesPerformed += 1;
              const serviceName = job.service.serviceName;
              if (!weeklyReport.serviceCounts[serviceName]) {
                  weeklyReport.serviceCounts[serviceName] = { count: 0, total: 0 };
              }
              weeklyReport.serviceCounts[serviceName].count += 1;
              weeklyReport.serviceCounts[serviceName].total += parseFloat(job.total);
          });

          if (weeklyReport.customerIds.has(appointment.customerId)) {
              weeklyReport.repeatCustomers += 1;
          } else {
              weeklyReport.newCustomers += 1;
              weeklyReport.customerIds.add(appointment.customerId);
          }
      }
  });

  // Convert the weeklyReports object into the desired array format
  let reportsArray = Object.keys(weeklyReports).map(week => {
      let report = weeklyReports[week];
      report.topPerformingService = Object.entries(report.serviceCounts).reduce((top, current) => current[1].count > top[1].count ? current : top, ["None", {count: 0}])[0];
      
      // Cleaning up data for the final report
      delete report.serviceCounts;
      delete report.customerIds; // No longer needed

      return {
          x: week,
          totalRevenue: report.totalRevenue,
          totalServicesPerformed: report.totalServicesPerformed,
          newCustomers: report.newCustomers,
          repeatCustomers: report.repeatCustomers,
          totalAppointments: report.totalAppointments,
          averageRevenuePerService: report.totalServicesPerformed ? (report.totalRevenue / report.totalServicesPerformed).toFixed(2) : "0.00",
          topPerformingService: report.topPerformingService,
          customerRetentionRate: report.totalAppointments > 0 ? ((report.repeatCustomers / (report.newCustomers + report.repeatCustomers)) * 100).toFixed(2) : "0.00",
      };
  });

  return reportsArray;
}
exports.generateFinancialGraphWeek = (appointments) => {
  // Initialize daily reports for a week
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  let dailyReports = daysOfWeek.reduce((acc, day) => ({
      ...acc,
      [day]: {
          totalRevenue: 0,
          totalServicesPerformed: 0,
          newCustomers: 0,
          repeatCustomers: 0,
          totalAppointments: 0,
          serviceCounts: {},
          customerIds: new Set(),
      }
  }), {});

  const getDayOfWeek = (date) => {
      const dayIndex = new Date(date).getDay(); // Sunday - 0, Monday - 1, etc.
      return daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust to make Monday the first day
  };

  appointments.forEach(appointment => {
      const dayOfWeek = getDayOfWeek(appointment.on);

      const dailyReport = dailyReports[dayOfWeek];
      dailyReport.totalAppointments += 1;

      if (appointment) {
          dailyReport.totalRevenue += parseFloat(appointment.total);

          appointment.jobs.forEach(job => {
              dailyReport.totalServicesPerformed += 1;
              const serviceName = job.service.serviceName;
              if (!dailyReport.serviceCounts[serviceName]) {
                  dailyReport.serviceCounts[serviceName] = { count: 0, total: 0 };
              }
              dailyReport.serviceCounts[serviceName].count += 1;
              dailyReport.serviceCounts[serviceName].total += parseFloat(job.total);
          });

          if (dailyReport.customerIds.has(appointment.customerId)) {
              dailyReport.repeatCustomers += 1;
          } else {
              dailyReport.newCustomers += 1;
              dailyReport.customerIds.add(appointment.customerId);
          }
      }
  });

  // Convert the dailyReports object into the desired array format
  let reportsArray = daysOfWeek.map(day => {
      let report = dailyReports[day];
      report.topPerformingService = Object.entries(report.serviceCounts).reduce((top, current) => current[1].count > top[1].count ? current : top, ["None", {count: 0}])[0];
      
      // Cleaning up data for the final report
      delete report.serviceCounts;
      delete report.customerIds; // No longer needed

      return {
          x: day,
          totalRevenue: report.totalRevenue,
          totalServicesPerformed: report.totalServicesPerformed,
          newCustomers: report.newCustomers,
          repeatCustomers: report.repeatCustomers,
          totalAppointments: report.totalAppointments,
          averageRevenuePerService: report.totalServicesPerformed ? (report.totalRevenue / report.totalServicesPerformed).toFixed(2) : "0.00",
          topPerformingService: report.topPerformingService,
          customerRetentionRate: report.totalAppointments > 0 ? ((report.repeatCustomers / (report.newCustomers + report.repeatCustomers)) * 100).toFixed(2) : "0.00",
      };
  });

  return reportsArray;
}

exports.customerStatusGraph =(appointments) =>{
 // Get the current date
 const currentDate = new Date();
    
 // Get the first day of the current month
 const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

 // Get the first day of the previous month
 const firstDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

 // Initialize arrays to store unique customer IDs
 const newCustomers = [];
 const returningCustomers = [];
 const lapsedCustomers = [];

 // Iterate through the appointments
 appointments.forEach(appointment => {
     const appointmentDate = new Date(appointment.on);

     // Check if the appointment is within the previous or current month
     if (appointmentDate >= firstDayOfPreviousMonth && appointmentDate < firstDayOfCurrentMonth) {
         // If the appointment was made in the previous month, add the customer ID to returningCustomers if not already present
         if (!returningCustomers.includes(appointment.customerId)) {
             returningCustomers.push(appointment.customerId);
         }

         // If the customer was in the lapsed customers list, remove them
         const lapsedIndex = lapsedCustomers.indexOf(appointment.customerId);
         if (lapsedIndex !== -1) {
             lapsedCustomers.splice(lapsedIndex, 1);
         }
     } else if (appointmentDate >= firstDayOfCurrentMonth && appointmentDate < currentDate) {
         // If the appointment was made in the current month, add the customer ID to newCustomers if not already present
         if (!newCustomers.includes(appointment.customerId)) {
             newCustomers.push(appointment.customerId);
         }
     } else {
         // If the appointment was in neither the current nor previous month, check if the customer is returning or lapsed
         const isReturning = returningCustomers.includes(appointment.customerId);
         if (isReturning && !newCustomers.includes(appointment.customerId)) {
             // If the customer was in the returning customers list but hasn't made a new appointment, they are lapsed
             lapsedCustomers.push(appointment.customerId);
         }
     }
 });

 // Calculate the number of total customers
 const totalCustomers = appointments.reduce((total, appointment) => {
     if (!total.includes(appointment.customerId)) {
         total.push(appointment.customerId);
     }
     return total;
 }, []).length;

 return {
     newCustomers: newCustomers.length,
     returningCustomers: returningCustomers.length,
     lapsedCustomers: lapsedCustomers.length,
     totalCustomers: totalCustomers
 };
}

exports.EP_STCGraphMonth= reports => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based.
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Helper function to calculate unique working days
    function getUniqueWorkingDays(dates) {
        return new Set(dates.map(date => {
            const dateObj = new Date(date);
            return dateObj.toISOString().split('T')[0];
        })).size;
    }

    // Organize data by employees and calculate intermediate metrics
    const employeeData = reports.reduce((acc, report) => {
        const date = new Date(report.on);
        const employeeId = report.employee.id;
        const employeeKey = `${employeeId}:${report.employee.user.firstName} ${report.employee.user.lastName}`;
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        if (!acc[employeeKey]) {
            acc[employeeKey] = {
                currentMonth: { services: [], durations: [], dates: [], totalRevenue: 0 },
                previousMonth: { services: [], durations: [], dates: [], totalRevenue: 0 }
            };
        }

        const serviceData = { serviceName:  report && report.service ? report.service.serviceName : '',duration: report.duration, total: parseFloat(report.total) };

        if (year === currentYear && month === currentMonth) {
            acc[employeeKey].currentMonth.services.push(serviceData);
            acc[employeeKey].currentMonth.durations.push(serviceData.duration);
            acc[employeeKey].currentMonth.dates.push(report.on);
            acc[employeeKey].currentMonth.totalRevenue += serviceData.total;
        } else if ((year === previousYear && month === previousMonth) || (year === currentYear && month === previousMonth)) {
            acc[employeeKey].previousMonth.services.push(serviceData);
            acc[employeeKey].previousMonth.durations.push(serviceData.duration);
            acc[employeeKey].previousMonth.dates.push(report.on);
            acc[employeeKey].previousMonth.totalRevenue += serviceData.total;
        }

        return acc;
    }, {});
    // console.log("🚀 ~ employeeData ~ employeeData:", employeeData)

    // Calculate KPIs for each employee
    const kpis = Object.entries(employeeData).map(([key, data]) => {
        const [employeeId, employeeName] = key.split(':');
        console.log("🚀 ~ kpis ~ employeeName:", employeeName)
        console.log("🚀 ~ kpis ~ employeeId:", employeeId)
        const calculateMostTimeConsumingService = (services) => {
            return services.reduce((max, service) => {
                if (service.duration > (max.duration || 0)) {
                    return { serviceName: service.serviceName, duration: service.duration };
                }
                return max;
            }, { serviceName: 'N/A', duration: 0 });
        };

        const currentMonthUniqueDays = getUniqueWorkingDays(data.currentMonth.dates);
        const previousMonthUniqueDays = getUniqueWorkingDays(data.previousMonth.dates);

        const mostTimeConsumingServiceCurrent = calculateMostTimeConsumingService(data.currentMonth.services);
        const mostTimeConsumingServicePrevious = calculateMostTimeConsumingService(data.previousMonth.services);

        const totalServicesCurrentMonth = data.currentMonth.services.length;
        const totalServicesPreviousMonth = data.previousMonth.services.length;

        const averageTimeCurrent = totalServicesCurrentMonth > 0 ? data.currentMonth.durations.reduce((a, b) => a + b, 0) / totalServicesCurrentMonth : 0;
        const averageTimePrevious = totalServicesPreviousMonth > 0 ? data.previousMonth.durations.reduce((a, b) => a + b, 0) / totalServicesPreviousMonth : 0;

        const totalTurnover = data.currentMonth.totalRevenue + data.previousMonth.totalRevenue;
        const dailyProfitsCurrent = currentMonthUniqueDays > 0 ? data.currentMonth.totalRevenue / currentMonthUniqueDays : 0;
        const dailyProfitsPrevious = previousMonthUniqueDays > 0 ? data.previousMonth.totalRevenue / previousMonthUniqueDays : 0;
        
        // Assuming upselling is calculated based on an increase in total services or revenue (placeholder)
        const upsellingSuccessRate = totalServicesPreviousMonth > 0 ? ((totalServicesCurrentMonth - totalServicesPreviousMonth) / totalServicesPreviousMonth) * 100 : 0;
       
         

        return {
            employeeId: employeeId*1,
            employeeName: employeeName,
            totalServicesPerformed_Current: totalServicesCurrentMonth,
            mostTimeConsumingService_Current: mostTimeConsumingServiceCurrent.serviceName,
            averageTimePerService_Current: averageTimeCurrent.toFixed(2),
            totalServicesPerformed_Previous: totalServicesPreviousMonth,
            mostTimeConsumingService_Previous: mostTimeConsumingServicePrevious.serviceName,
            averageTimePerService_Previous: averageTimePrevious.toFixed(2),
            turnover_Current: data.currentMonth.totalRevenue.toFixed(2),
            turnover_Previous: data.previousMonth.totalRevenue.toFixed(2),
            toalTurnover: totalTurnover.toFixed(2),
            dailyProfits_Current: dailyProfitsCurrent.toFixed(2),
            dailyProfits_Previous: dailyProfitsPrevious.toFixed(2),
            UpsellingSuccessRate: upsellingSuccessRate.toFixed(2)
        };
    });
 

    return kpis;
};


exports.EP_STCGraphWeek = (data) => {
    // Get the current date
    const today = new Date();

    // Calculate the start and end dates of the current week
    const currentWeekStartDate = new Date(today);
    currentWeekStartDate.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    const currentWeekEndDate = new Date(today);
    currentWeekEndDate.setDate(today.getDate() + (6 - today.getDay())); // End of current week (Saturday)

    // Calculate the start and end dates of the previous week
    const previousWeekStartDate = new Date(currentWeekStartDate);
    previousWeekStartDate.setDate(currentWeekStartDate.getDate() - 7); // Start of previous week
    const previousWeekEndDate = new Date(currentWeekEndDate);
    previousWeekEndDate.setDate(currentWeekEndDate.getDate() - 7); // End of previous week

    // Filter data for the current week and previous week
    const currentWeekData = data.filter(report => {
        const reportDate = new Date(report.on);
        return reportDate >= currentWeekStartDate && reportDate <= currentWeekEndDate;
    });

    const previousWeekData = data.filter(report => {
        const reportDate = new Date(report.on);
        return reportDate >= previousWeekStartDate && reportDate <= previousWeekEndDate;
    });

    // Now you have currentWeekData and previousWeekData, proceed with the calculations as before...
    // Calculate KPIs for each employee
    const kpis = Object.entries(currentEmployeeData).map(([key, data]) => {
        // Your existing KPI calculation logic here
    });

    return kpis;
};


exports.EP_STCGraphYear= reports => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const previousYear = currentYear - 1;

    // Helper function remains the same
    function getUniqueWorkingDays(dates) {
        return new Set(dates.map(date => {
            const dateObj = new Date(date);
            return dateObj.toISOString().split('T')[0];
        })).size;
    }

    // Organize data by employees for yearly comparison
    const employeeData = reports.reduce((acc, report) => {
        const date = new Date(report.on);
        const employeeId = report.employee.id;
        const employeeKey = `${employeeId}:${report.employee.user.firstName} ${report.employee.user.lastName}`;
        const year = date.getFullYear();

        if (!acc[employeeKey]) {
            acc[employeeKey] = {
                currentYear: { services: [], durations: [], dates: [], totalRevenue: 0 },
                previousYear: { services: [], durations: [], dates: [], totalRevenue: 0 }
            };
        }

        const serviceData = { serviceName:report && report.service ? report.service.serviceName : '', duration: report.duration, total: parseFloat(report.total) };

        if (year === currentYear) {
            acc[employeeKey].currentYear.services.push(serviceData);
            acc[employeeKey].currentYear.durations.push(serviceData.duration);
            acc[employeeKey].currentYear.dates.push(report.on);
            acc[employeeKey].currentYear.totalRevenue += serviceData.total;
        } else if (year === previousYear) {
            acc[employeeKey].previousYear.services.push(serviceData);
            acc[employeeKey].previousYear.durations.push(serviceData.duration);
            acc[employeeKey].previousYear.dates.push(report.on);
            acc[employeeKey].previousYear.totalRevenue += serviceData.total;
        }

        return acc;
    }, {});

    // Calculation of KPIs for yearly comparison follows the same logic, just adjusted for yearly data
    const kpis = Object.entries(employeeData).map(([key, data]) => {
        // ... (The rest of the KPI calculation logic remains largely the same)
        
        // Adjustments are made here to calculate metrics based on yearly data instead of monthly
        // This includes using `currentYear` and `previousYear` data structures instead of `currentMonth` and `previousMonth`

        // Example adjustment for calculating unique days in the year
        const currentYearUniqueDays = getUniqueWorkingDays(data.currentYear.dates);
        const previousYearUniqueDays = getUniqueWorkingDays(data.previousYear.dates);

        // The rest of the KPI calculations would be adjusted in a similar manner
    });

    return kpis;
};
//!Admin
///*1 Top performing services Graph
exports.adminTopPerformingServices = data => {
    const labels = [];
    const revenues = [];
  
    data.forEach(item => {
      labels.push(item.typeName);
      let totalRevenue = 0;
      item.services.forEach(service => {
        if (service.revenue) {
           totalRevenue += parseFloat(service.revenue.replace(/,/g, ''));
        }
      });
      revenues.push(totalRevenue);
    });
  
    const dashboardBarChartData = {
      labels: labels,
      datasets: [{ data: revenues }]
    };
  
    return dashboardBarChartData;
  }

exports.adminTopPerformingSalons =salonData => {
    // Extract salon names for labels and metrics for datasets
    const labels = salonData.map(salon => salon.salonName);
    const revenueData = salonData.map(salon => parseFloat(salon.revenue));
    const bookingCountData = salonData.map(salon => salon.bookingCount);
    const totalServicesData = salonData.map(salon => salon.totalServices);
  
    // Prepare chart data object
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          backgroundColor: "rgb(255, 99, 132)"
        },
        {
          label: "Booking Count",
          data: bookingCountData,
          backgroundColor: "rgb(75, 192, 192)"
        },
        {
          label: "Total Services",
          data: totalServicesData,
          backgroundColor: "rgb(53, 162, 235)"
        }
      ]
    };
  
    return chartData;
  }
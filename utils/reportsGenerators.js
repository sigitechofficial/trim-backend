const Formate = require("./formater");
 
exports.peakTimeReportGenerator = appointments => {
 
    const dayOfWeekMap = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday'
    };

    const totals = {
        'Monday': { customers: 0, services: 0 },
        'Tuesday': { customers: 0, services: 0 },
        'Wednesday': { customers: 0, services: 0 },
        'Thursday': { customers: 0, services: 0 },
        'Friday': { customers: 0, services: 0 },
        'Saturday': { customers: 0, services: 0 },
        'Sunday': { customers: 0, services: 0 },
    };

    appointments.forEach(appointment => {
        const date = new Date(appointment.on);
        const dayOfWeek = dayOfWeekMap[date.getDay()];

        totals[dayOfWeek].customers += 1; // Assuming each appointment is a unique customer
        totals[dayOfWeek].services += appointment.serviceCount;
    });

    const averages = {
        customers: Object.values(totals).reduce((acc, curr) => acc + curr.customers, 0) / 7,
        services: Object.values(totals).reduce((acc, curr) => acc + curr.services, 0) / 7,
    };

    const report = Object.entries(totals).map(([day, { customers, services }]) => {
        let popularity = 'Moderate'; // Default classification

        if (customers > averages.customers && services > averages.services) {
            popularity = 'Most Popular';
        } else if (customers < 20 || services < 51) {
            popularity = 'Least Popular';
        }

        return { Day: day, Popularity: popularity, TotalCustomers: customers, TotalServices: services };
    });

    console.table(report);
    return report;
 
};

exports.generateFinancialReport= appointments => {
     
        let monthlyReports = {};
        let customerHistory = {}; 
    
        appointments.forEach(appointment => {
            const [year, month] = appointment.on.split('-');
            const monthKey = `${year}-${month}`;
    
            if (!monthlyReports[monthKey]) {
                monthlyReports[monthKey] = {
                    totalRevenue: 0,
                    totalServicesPerformed: 0,
                    newCustomers: 0,
                    repeatCustomers: 0,
                    totalAppointments: 0,
                    serviceCounts: {},
                };
                customerHistory[monthKey] = new Set();
            }
    
            const monthlyReport = monthlyReports[monthKey];
            monthlyReport.totalAppointments += 1; 
    
            if (appointment) {
                monthlyReport.totalRevenue += parseFloat(appointment.total);
    
                appointment.jobs.forEach(job => {
                    monthlyReport.totalServicesPerformed += 1;
                    const serviceName = job.service.serviceName;
                    if (!monthlyReport.serviceCounts[serviceName]) {
                        monthlyReport.serviceCounts[serviceName] = { count: 0, total: 0 };
                    }
                    monthlyReport.serviceCounts[serviceName].count += 1;
                    monthlyReport.serviceCounts[serviceName].total += parseFloat(job.total);
                });
    
                if (customerHistory[monthKey].has(appointment.customerId)) {
                    monthlyReport.repeatCustomers += 1;
                } else {
                    monthlyReport.newCustomers += 1;
                    customerHistory[monthKey].add(appointment.customerId);
                }
            }
        });
    
        // console.log("🚀 ~ Object.keys ~ monthlyReports:", monthlyReports)
        Object.keys(monthlyReports).forEach(monthKey => {
            const report = monthlyReports[monthKey];
            report.month = Formate.getMonthName(monthKey);
            report.averageRevenuePerService = report.totalServicesPerformed ? (report.totalRevenue / report.totalServicesPerformed).toFixed(2) : "0.00";
            // console.log("🚀 ~ Object.keys ~ averageRevenuePerService:", averageRevenuePerService)
    
            // Fix applied here with initial value for reduce
            const entries = Object.entries(report.serviceCounts);
            // console.log("🚀 ~ report.topPerformingService=entries.length?entries.reduce ~ report.topPerformingService:", report.topPerformingService)
            report.topPerformingService = entries.length ? entries.reduce((topService, currentService) => {
                return currentService[1].count > topService[1].count ? currentService : topService;
            })[0] : 0;
    
            report.customerRetentionRate = report.totalAppointments > 0 ? ((report.repeatCustomers / (report.newCustomers + report.repeatCustomers)) * 100).toFixed(2) : "0.00";
    
            // Clean up intermediate data structures
            delete report.serviceCounts;
        });
    
        return Formate.finalcialReport(monthlyReports);
};
 
exports.generateEmployeeComparisionReport= reports => {
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

        const serviceData = { serviceName: report.service.serviceName, duration: report.duration, total: parseFloat(report.total) };

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
            totalServicesPerformed_CurrentMonth: totalServicesCurrentMonth,
            mostTimeConsumingService_CurrentMonth: mostTimeConsumingServiceCurrent.serviceName,
            averageTimePerService_CurrentMonth: averageTimeCurrent.toFixed(2),
            totalServicesPerformed_PreviousMonth: totalServicesPreviousMonth,
            mostTimeConsumingService_PreviousMonth: mostTimeConsumingServicePrevious.serviceName,
            averageTimePerService_PreviousMonth: averageTimePrevious.toFixed(2),
            turnover_CurrentMonth: data.currentMonth.totalRevenue.toFixed(2),
            turnover_PreviousMonth: data.previousMonth.totalRevenue.toFixed(2),
            toalTurnover: totalTurnover.toFixed(2),
            dailyProfits_CurrentMonth: dailyProfitsCurrent.toFixed(2),
            dailyProfits_PreviousMonth: dailyProfitsPrevious.toFixed(2),
            UpsellingSuccessRate: upsellingSuccessRate.toFixed(2)
        };
    });
 

    return kpis;
};

exports.timeOffDayAnalysisReportGenerator = appointments => {
    // Helper function to round down to the nearest hour
    function roundDownToNearestHour(date) {
        return new Date(date.setMinutes(0, 0, 0));
    }
    // Sort appointments by start time
    appointments.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const timeSlots = {};

    appointments.forEach(appointment => {
        const startTime = new Date(`1970-01-01T${appointment.startTime}Z`);
        const roundedStartTime = roundDownToNearestHour(startTime);
        const endTime = new Date(roundedStartTime.getTime() + 60 * 60 * 1000); // Add one hour

        const slotKey = `${roundedStartTime.getUTCHours().toString().padStart(2, '0')}:00 - ${endTime.getUTCHours().toString().padStart(2, '0')}:00`;

        if (!timeSlots[slotKey]) {
            timeSlots[slotKey] = { customers: 0, revenue: 0 };
        }

        timeSlots[slotKey].customers += 1;
        timeSlots[slotKey].revenue += parseFloat(appointment.total);
    });
    console.log("🚀 ~ timeSlots:", timeSlots)

    // Generate the report
    const report = Object.entries(timeSlots).map(([key, { customers, revenue }]) => {

        const staffingLevels = ['low', 'adequate', 'busy'];
        const randomIndex = Math.floor(Math.random() * staffingLevels.length);

        const averageTransactionValue = customers > 0 ? (revenue / customers).toFixed(2) : "0.00";
        return {
            time: key,
            numberOfCustomers: customers,
            Revenue: revenue.toFixed(2),
            averageTransactionValue: averageTransactionValue,
            staffingLevels:staffingLevels[randomIndex],
            opportunitiesForPromotions:''
        };
    });

    return report;
};

exports.clientFileReportGenerator = appointments => {
    const currentDate = new Date();
    const twoMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 2));
    const report = {};
    
    appointments.forEach(appointment => {
      const { user, status, on, jobs } = appointment;
      const customerId = user.id;
      if (!report[customerId]) {
        report[customerId] = {
          customerId,
          customer: `${user.firstName} ${user.lastName}`,
          status: "", 
          totalServices: 0,
          servicesUsed: 0,
          noOfBookings: 0,
          averageSpent: 0, // 
          noShowBookingCount: 0,
          cancelledBookingCount: 0,
          lastVisit: new Date(on),
          visitFrequency: "" 
        };
      }
  
      const reportEntry = report[customerId];
      reportEntry.totalServices += appointment.serviceCount;
      reportEntry.noOfBookings += 1;
      reportEntry.averageSpent += Number(appointment.actualCapturedAmount);
      reportEntry.lastVisit = new Date(on) > reportEntry.lastVisit ? new Date(on) : reportEntry.lastVisit;
      
      
      if (status === "complete") {
        reportEntry.servicesUsed += jobs.length;
      } else if (status === "no-show") {
        reportEntry.noShowBookingCount += 1;
      } else if (status === "cancel") {
        reportEntry.cancelledBookingCount += 1;
      }
    });
  
    //  customer status 
    Object.values(report).forEach(customer => {
      customer.averageSpent /= customer.noOfBookings;
  
      // Customer Status
      if (customer.noOfBookings === 1 && customer.lastVisit > twoMonthsAgo) { // only one booking in last two month
        customer.status = "New Customer";
      } else if (customer.noOfBookings > 1 && customer.lastVisit > twoMonthsAgo) {// More than one booking in last two month
        customer.status = "Returning Customer";
      } else {// 0 booking in Last two months
        customer.status = "Lapsed Customer";
      }
  
      // Visit Frequency 
      if (customer.noOfBookings < 4) {
        customer.visitFrequency = "Low Frequency";
      } else if (customer.noOfBookings === 4) {
        customer.visitFrequency = "Medium Frequency";
      } else {
        customer.visitFrequency = "High Frequency";
      }
    });
  
    // console.log(Object.values(report));
    
    return Object.values(report);
};

exports.appointmentConversionGenerator = appointments => {
const bookingCountsByDate = {};

appointments.forEach(appointment => {
  const { bookingDate, status, bookingCount } = appointment;

  if (!bookingCountsByDate[bookingDate]) {
    bookingCountsByDate[bookingDate] = {
      completeBookingCount: 0,
      noShowBookingCount: 0,
      cancelBookingCount: 0,
      totalBooking: 0,
      conversionRate: 0
    };
  }

  if (status === 'complete') {
    bookingCountsByDate[bookingDate].completeBookingCount += bookingCount;
  } else if (status === 'no-show') {
    bookingCountsByDate[bookingDate].noShowBookingCount += bookingCount;
  } else if (status === 'cancel') {
    bookingCountsByDate[bookingDate].cancelBookingCount += bookingCount;
  }

  bookingCountsByDate[bookingDate].totalBooking += bookingCount;
});

// Calculate the conversion rate for each date
Object.values(bookingCountsByDate).forEach(counts => {
    const totalCancelledNoShow = counts.cancelBookingCount + counts.noShowBookingCount;
    if (totalCancelledNoShow > 0) {
      counts.conversionRate = counts.completeBookingCount / totalCancelledNoShow * 100;
    } else {
      // If there are no cancelled or no-show bookings, set the conversion rate to 100%
      counts.conversionRate = counts.completeBookingCount === 0 ? 0 : 100;
    }
    counts.conversionRate = `${counts.conversionRate}%`;

  });

// Convert the booking counts by date object into an array
const result = Object.entries(bookingCountsByDate).map(([bookingDate, counts]) => ({
  bookingDate,
  ...counts
}));
console.log("🚀 ~ result ~ result:", result)

console.log(result);
return result
   
};
  
exports.dayOnDate = date => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
}

 
 
 

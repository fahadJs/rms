const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const getPosMonthlyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            // Handle the case where time_zone is not available
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        console.log(`Current Date: ${currentDate}`); // Log the current date

        // Calculate the start date of the current month
        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        console.log('Start of the month: ', startOfMonth);

        // Fetch orders within the current month
        const ordersQuery = `
            SELECT 
                po.PosOrderID,
                po.total_amount AS Income
            FROM 
                pos_orders po
            WHERE 
                po.restaurant_id = ?
                AND po.time >= ?
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfMonth]);

        console.log("Orders within the month:", ordersData); // Log the orders within the month

        // Calculate total Income for all orders
        let totalIncome = 0;

        ordersData.forEach(order => {
            totalIncome += order.Income;
        });

        const formattedData = {
            name: moment(startOfMonth).format('MMM'),
            Expense: 0,  // Set expense to 0 for now, we'll calculate it in the next step
            Income: parseFloat(totalIncome.toFixed(2))
        };

        // Calculate total Expense for all orders
        const posOrderIds = ordersData.map(order => order.PosOrderID);
        if (posOrderIds.length > 0) {
            const itemsQuery = `
                SELECT 
                    PosOrderID,
                    SUM(poi.Quantity * mi.CostPrice) AS Expense
                FROM 
                    pos_order_items poi
                    JOIN menuitems mi ON poi.MenuItemID = mi.MenuItemID
                WHERE 
                    PosOrderID IN (?)
                GROUP BY 
                    PosOrderID
            `;
            const itemsData = await poolConnection.query(itemsQuery, [posOrderIds]);

            console.log("Items data:", itemsData); // Log the items data

            // Aggregate the expense for each order
            itemsData.forEach(item => {
                formattedData.Expense += item.Expense;
            });
        }

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getPosWeeklyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            // Handle the case where time_zone is not available
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        console.log(`Current Date: ${currentDate}`); // Log the current date

        // Calculate the start date of the current week
        const startOfWeek = moment(currentDate).startOf('week').format('YYYY-MM-DD HH:mm:ss');

        console.log('Start of the week: ', startOfWeek);

        // Fetch orders within the current week
        const ordersQuery = `
            SELECT 
                po.PosOrderID,
                po.total_amount AS Income
            FROM 
                pos_orders po
            WHERE 
                po.restaurant_id = ?
                AND po.time >= ?
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfWeek]);

        console.log("Orders within the week:", ordersData); // Log the orders within the week

        // Calculate total Income for all orders
        let totalIncome = 0;

        ordersData.forEach(order => {
            totalIncome += order.Income;
        });

        const formattedData = {
            name: moment(startOfWeek).format('ddd'),
            Expense: 0,  // Set expense to 0 for now, we'll calculate it in the next step
            Income: parseFloat(totalIncome.toFixed(2))
        };

        // Calculate total Expense for all orders
        const posOrderIds = ordersData.map(order => order.PosOrderID);
        if (posOrderIds.length > 0) {
            const itemsQuery = `
                SELECT 
                    PosOrderID,
                    SUM(poi.Quantity * mi.CostPrice) AS Expense
                FROM 
                    pos_order_items poi
                    JOIN menuitems mi ON poi.MenuItemID = mi.MenuItemID
                WHERE 
                    PosOrderID IN (?)
                GROUP BY 
                    PosOrderID
            `;
            const itemsData = await poolConnection.query(itemsQuery, [posOrderIds]);

            console.log("Items data:", itemsData); // Log the items data

            // Aggregate the expense for each order
            itemsData.forEach(item => {
                formattedData.Expense += item.Expense;
            });
        }

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching weekly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getPosDailyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            // Handle the case where time_zone is not available
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        console.log(`Current Date: ${currentDate}`); // Log the current date

        const twentyFourHoursAgo = moment(currentDate).subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

        console.log('24hrs: ', twentyFourHoursAgo);

        const ordersQuery = `
            SELECT 
                po.PosOrderID,
                po.total_amount AS Income
            FROM 
                pos_orders po
            WHERE 
                po.restaurant_id = ?
                AND po.time >= ?
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, twentyFourHoursAgo]);

        console.log("Orders within 24 hours:", ordersData); // Log the orders within the 24-hour window

        // Calculate total Income for all orders
        let totalIncome = 0;

        ordersData.forEach(order => {
            totalIncome += order.Income;
        });

        const formattedData = {
            name: moment(currentDate).format('D'),
            Expense: 0,  // Set expense to 0 for now, we'll calculate it in the next step
            Income: parseFloat(totalIncome.toFixed(2))
        };

        // Calculate total Expense for all orders
        const itemsQuery = `
            SELECT 
                PosOrderID,
                SUM(poi.Quantity * mi.CostPrice) AS Expense
            FROM 
                pos_order_items poi
                JOIN menuitems mi ON poi.MenuItemID = mi.MenuItemID
            WHERE 
                PosOrderID IN (?)
            GROUP BY 
                PosOrderID
        `;
        const posOrderIds = ordersData.map(order => order.PosOrderID);
        const itemsData = await poolConnection.query(itemsQuery, [posOrderIds]);

        console.log("Items data:", itemsData); // Log the items data

        // Aggregate the expense for each order
        itemsData.forEach(item => {
            formattedData.Expense += item.Expense;
        });

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching current daily data: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterMonthlyExpenseAdmin = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            // Handle the case where time_zone is not available
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        console.log(`Current Date: ${currentDate}`); // Log the current date

        // Calculate the start date of the current month
        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        console.log('Start of the month: ', startOfMonth);

        // Fetch orders and items within the current month
        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.total_amount AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfMonth]);

        console.log("Orders within the month:", ordersData); // Log the orders within the month

        // Calculate total Income for all orders
        let totalOrderIncome = 0;
        let totalItemExpense = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

        // Fetch items within the current month
        const itemsQuery = `
            SELECT 
                oi.OrderID,
                SUM(oi.Quantity * mi.CostPrice) AS ItemExpense
            FROM 
                order_items oi
                JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
            WHERE 
                oi.OrderID IN (?)
            GROUP BY 
                oi.OrderID;
        `;
        const itemsData = await poolConnection.query(itemsQuery, [ordersData.map(order => order.OrderID)]);

        console.log("Items data:", itemsData); // Log the items data

        // Calculate total ItemExpense for all orders
        itemsData.forEach(item => {
            totalItemExpense += item.ItemExpense;
        });

        const formattedData = {
            name: moment(startOfMonth).format('MMM'),
            Expense: parseFloat(totalItemExpense.toFixed(2)),
            Income: parseFloat(totalOrderIncome.toFixed(2)),
        };

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterDailyExpenseAdmin = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            // Handle the case where time_zone is not available
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        console.log(`Current Date: ${currentDate}`); // Log the current date

        // Calculate the start date of the last 24 hours
        const startOf24HoursAgo = moment(currentDate).subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

        console.log('Start of the last 24 hours: ', startOf24HoursAgo);

        // Fetch orders within the last 24 hours
        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.total_amount AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOf24HoursAgo]);

        console.log("Orders within the last 24 hours:", ordersData); // Log the orders within the last 24 hours

        // Calculate total OrderIncome for all orders
        let totalOrderIncome = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

        // Fetch items within the last 24 hours orders
        const itemsQuery = `
            SELECT 
                oi.OrderID,
                SUM(oi.Quantity * mi.CostPrice) AS ItemExpense
            FROM 
                order_items oi
                JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
            WHERE 
                oi.OrderID IN (?)
            GROUP BY 
                oi.OrderID;
        `;
        const itemsData = await poolConnection.query(itemsQuery, [ordersData.map(order => order.OrderID)]);

        console.log("Items data:", itemsData); // Log the items data

        // Calculate total ItemExpense for all orders
        let totalItemExpense = 0;

        itemsData.forEach(item => {
            totalItemExpense += item.ItemExpense;
        });

        const formattedData = {
            name: moment(startOf24HoursAgo).format('D'),
            Expense: parseFloat(totalItemExpense.toFixed(2)),
            Income: parseFloat(totalOrderIncome.toFixed(2)),
        };

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching daily report for admin: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterWeeklyExpenseAdmin = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            // Handle the case where time_zone is not available
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        console.log(`Current Date: ${currentDate}`); // Log the current date

        // Calculate the start date of the last 7 days
        const startOfLastWeek = moment(currentDate).subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss');

        console.log('Start of the last 7 days: ', startOfLastWeek);

        // Fetch orders within the last 7 days
        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.total_amount AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfLastWeek]);

        console.log("Orders within the last 7 days:", ordersData); // Log the orders within the last 7 days

        // Calculate total OrderIncome for all orders
        let totalOrderIncome = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

        // Fetch items within the last 7 days orders
        const itemsQuery = `
            SELECT 
                oi.OrderID,
                SUM(oi.Quantity * mi.CostPrice) AS ItemExpense
            FROM 
                order_items oi
                JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
            WHERE 
                oi.OrderID IN (?)
            GROUP BY 
                oi.OrderID;
        `;
        const itemsData = await poolConnection.query(itemsQuery, [ordersData.map(order => order.OrderID)]);

        console.log("Items data:", itemsData); // Log the items data

        // Calculate total ItemExpense for all orders
        let totalItemExpense = 0;

        itemsData.forEach(item => {
            totalItemExpense += item.ItemExpense;
        });

        const formattedData = {
            name: moment(startOfLastWeek).format('ddd'),
            Expense: parseFloat(totalItemExpense.toFixed(2)),
            Income: parseFloat(totalOrderIncome.toFixed(2)),
        };

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching weekly report for admin: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterMonthlyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
    DATE_FORMAT(o.time, '%b') AS month,
    oi.ItemName,
    SUM(oi.Quantity * mi.CostPrice) AS ItemExpense,
    SUM(oi.Price) AS TotalIncome
FROM 
    orders o
    JOIN order_items oi ON o.OrderID = oi.OrderID
    JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
WHERE 
    o.restaurant_id = ?
GROUP BY 
    month, oi.ItemName
ORDER BY 
    month, ItemExpense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const nestedData = data.reduce((acc, row) => {
            const { month, ItemName, ItemExpense, TotalIncome } = row;
            acc[month] = acc[month] || [];
            acc[month].push({
                ItemName,
                ItemExpense: parseFloat(ItemExpense.toFixed(2)),
                TotalIncome: parseFloat(TotalIncome.toFixed(2)),
            });
            return acc;
        }, {});

        res.json({ nestedData });
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterWeeklyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
            CONCAT(YEAR(o.time), '-', WEEK(o.time)) AS week,
            oi.ItemName,
            SUM(oi.Quantity * mi.CostPrice) AS ItemExpense,
            SUM(oi.Price) AS TotalIncome
        FROM 
            orders o
            JOIN order_items oi ON o.OrderID = oi.OrderID
            JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
        WHERE 
            o.restaurant_id = ?
        GROUP BY 
            week, oi.ItemName
        ORDER BY 
            week, ItemExpense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const nestedData = data.reduce((acc, row) => {
            const { week, ItemName, ItemExpense, TotalIncome } = row;
            acc[week] = acc[week] || [];
            acc[week].push({
                ItemName,
                ItemExpense: parseFloat(ItemExpense.toFixed(2)),
                TotalIncome: parseFloat(TotalIncome.toFixed(2)),
            });
            return acc;
        }, {});

        res.json({ nestedData });
    } catch (error) {
        console.error(`Error fetching weekly report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

const getWaiterDailyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const query = `
        SELECT 
            DATE(o.time) AS day,
            oi.ItemName,
            SUM(oi.Quantity * mi.CostPrice) AS ItemExpense,
            SUM(oi.Price) AS TotalIncome
        FROM 
            orders o
            JOIN order_items oi ON o.OrderID = oi.OrderID
            JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
        WHERE 
            o.restaurant_id = ?
        GROUP BY 
            day, oi.ItemName
        ORDER BY 
            day, ItemExpense DESC;
    `;
        const data = await poolConnection.query(query, [restaurantId]);

        const nestedData = data.reduce((acc, row) => {
            const { day, ItemName, ItemExpense, TotalIncome } = row;
            acc[day] = acc[day] || [];
            acc[day].push({
                ItemName,
                ItemExpense: parseFloat(ItemExpense.toFixed(2)),
                TotalIncome: parseFloat(TotalIncome.toFixed(2)),
            });
            return acc;
        }, {});

        res.json({ nestedData });
    } catch (error) {
        console.error(`Error fetching daily report: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}


module.exports = {
    getPosMonthlyExpense,
    getPosWeeklyExpense,
    getPosDailyExpense,

    getWaiterMonthlyExpense,
    getWaiterWeeklyExpense,
    getWaiterDailyExpense,

    getWaiterMonthlyExpenseAdmin,
    getWaiterWeeklyExpenseAdmin,
    getWaiterDailyExpenseAdmin
}
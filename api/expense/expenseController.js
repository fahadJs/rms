const poolConnection = require('../../config/database');
const moment = require('moment-timezone');

const getPosMonthlyExpense = async (req, res) => {

    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const ordersQuery = `
        SELECT 
            po.PosOrderID,
            po.total_amount AS Income,
            DATE_FORMAT(po.time, '%b') AS Month
        FROM 
            pos_orders po
        WHERE 
            po.restaurant_id = ?
            AND po.time >= ?
    `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfMonth]);

        if (ordersData.length === 0) {
            const monthlyData = [];

            for (let i = 0; i < 12; i++) {
                const monthStart = moment(currentDate).startOf('year').add(i, 'months');
                const monthKey = monthStart.format('MMM');

                const formattedData = {
                    name: monthKey,
                    Expense: 0,
                    Income: 0
                };

                monthlyData.push(formattedData);
            }

            res.json(monthlyData);
            return;
        }

        const monthlyData = [];

        for (let i = 0; i < 12; i++) {
            const monthStart = moment(currentDate).startOf('year').add(i, 'months');
            const monthKey = monthStart.format('MMM');

            const monthData = {
                name: monthKey,
                Expense: 0,
                Income: 0
            };

            const monthOrders = ordersData.filter(order => order.Month === monthKey);

            monthOrders.forEach(order => {
                monthData.Income += order.Income;
            });

            const posOrderIds = monthOrders.map(order => order.PosOrderID);
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

                itemsData.forEach(item => {
                    monthData.Expense += item.Expense;
                });
            }

            monthlyData.push(monthData);
        }

        res.json(monthlyData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getPosWeeklyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const startOfWeek = moment(currentDate).startOf('week').format('YYYY-MM-DD HH:mm:ss');

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

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(startOfWeek).format('ddd'),
                Expense: 0,
                Income: 0
            };
            return res.json(formattedData);
        }

        let totalIncome = 0;

        ordersData.forEach(order => {
            totalIncome += order.Income;
        });

        const formattedData = {
            name: moment(startOfWeek).format('ddd'),
            Expense: 0,
            Income: parseFloat(totalIncome.toFixed(2))
        };

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

            itemsData.forEach(item => {
                formattedData.Expense += item.Expense;
            });
        }

        res.json(formattedData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getPosDailyExpense = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        // const timeZone = currentDateResult[0].time_zone;
        // const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        // const twentyFourHoursAgo = moment(currentDate).subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        // Combine the current date with the opening time
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

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
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, openingTime]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(openingTime).format('D'),
                Expense: 0,
                Income: 0
            };
            return res.json(formattedData);
        }

        let totalIncome = 0;

        ordersData.forEach(order => {
            totalIncome += order.Income;
        });

        const formattedData = {
            name: moment(openingTime).format('D'),
            Expense: 0,
            Income: parseFloat(totalIncome.toFixed(2))
        };

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

        itemsData.forEach(item => {
            formattedData.Expense += item.Expense;
        });

        res.json(formattedData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getWaiterMonthlyExpenseAdminAllMonths = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const ordersQuery = `
        SELECT 
            o.OrderID,
            o.after_tax AS Income,
            DATE_FORMAT(o.time, '%b') AS Month
        FROM 
            orders o
        WHERE 
            o.restaurant_id = ?
            AND o.time >= ?
    `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfMonth]);

        if (ordersData.length === 0) {
            const monthlyData = [];

            for (let i = 0; i < 12; i++) {
                const monthStart = moment(currentDate).startOf('year').add(i, 'months');
                const monthKey = monthStart.format('MMM');

                const formattedData = {
                    name: monthKey,
                    Expense: 0,
                    Income: 0
                };

                monthlyData.push(formattedData);
            }

            res.json(monthlyData);
            return;
        }

        const monthlyData = [];

        for (let i = 0; i < 12; i++) {
            const monthStart = moment(currentDate).startOf('year').add(i, 'months');
            const monthKey = monthStart.format('MMM');

            const monthData = {
                name: monthKey,
                Expense: 0,
                Income: 0
            };

            const monthOrders = ordersData.filter(order => order.Month === monthKey);

            monthOrders.forEach(order => {
                monthData.Income += order.Income;
            });

            const OrderIds = monthOrders.map(order => order.OrderID);
            if (OrderIds.length > 0) {
                const itemsQuery = `
                SELECT 
                    OrderID,
                    SUM(oi.Quantity * mi.CostPrice) AS Expense
                FROM 
                    order_items oi
                    JOIN menuitems mi ON oi.MenuItemID = mi.MenuItemID
                WHERE 
                    OrderID IN (?)
                GROUP BY 
                    OrderID
            `;
                const itemsData = await poolConnection.query(itemsQuery, [OrderIds]);

                itemsData.forEach(item => {
                    monthData.Expense += item.Expense;
                });
            }

            monthlyData.push(monthData);
        }

        res.json(monthlyData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}





const getWaiterMonthlyExpenseAdmin = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.after_tax AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfMonth]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(startOfMonth).format('MMM'),
                Expense: 0,
                Income: 0
            };
            return res.json(formattedData);
        }

        let totalOrderIncome = 0;
        let totalItemExpense = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getWaiterDailyExpenseAdmin = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        // Combine the current date with the opening time
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;


        // const timeZone = currentDateResult[0].time_zone;
        // const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        // const startOf24HoursAgo = moment(currentDate).subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.after_tax AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, openingTime]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(openingTime).format('D'),
                Expense: 0,
                Income: 0
            };
            return res.json(formattedData);
        }
        let totalOrderIncome = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

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

        let totalItemExpense = 0;

        itemsData.forEach(item => {
            totalItemExpense += item.ItemExpense;
        });

        const formattedData = {
            name: moment(openingTime).format('D'),
            Expense: parseFloat(totalItemExpense.toFixed(2)),
            Income: parseFloat(totalOrderIncome.toFixed(2)),
        };

        res.json(formattedData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}

const getWaiterWeeklyExpenseAdmin = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const startOfLastWeek = moment(currentDate).subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss');

        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.after_tax AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfLastWeek]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(startOfLastWeek).format('ddd'),
                Expense: 0,
                Income: 0
            };
            return res.json(formattedData);
        }
        let totalOrderIncome = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

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
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}





const getPosMonthlyExpenseData = async (restaurantId) => {
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const ordersQuery = `
            SELECT 
                po.PosOrderID,
                po.time,
                po.total_amount AS OrderIncome
            FROM 
                pos_orders po
            WHERE 
                po.restaurant_id = ?
                AND po.time >= ?
            ORDER BY 
                po.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfMonth]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(startOfMonth).format('MMM'),
                Expense: 0,
                Income: 0
            };
            return formattedData;
        }

        let totalOrderIncome = 0;
        let totalItemExpense = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

        const itemsQuery = `
            SELECT 
                poi.PosOrderID,
                SUM(poi.Quantity * mi.CostPrice) AS ItemExpense
            FROM 
                pos_order_items poi
                JOIN menuitems mi ON poi.MenuItemID = mi.MenuItemID
            WHERE 
                poi.PosOrderID IN (?)
            GROUP BY 
                poi.PosOrderID;
        `;
        const itemsData = await poolConnection.query(itemsQuery, [ordersData.map(order => order.PosOrderID)]);

        itemsData.forEach(item => {
            totalItemExpense += item.ItemExpense;
        });

        const formattedData = {
            name: moment(startOfMonth).format('MMM'),
            Expense: parseFloat(totalItemExpense.toFixed(2)),
            Income: parseFloat(totalOrderIncome.toFixed(2)),
        };

        return formattedData;
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        return error;
    }
}

const getWaiterMonthlyExpenseAdminData = async (restaurantId) => {
    try {
        const currentDateQuery = `SELECT time_zone FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        const timeZone = currentDateResult[0].time_zone;
        const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.after_tax AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, startOfMonth]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(startOfMonth).format('MMM'),
                Expense: 0,
                Income: 0
            };
            return formattedData;
        }

        let totalOrderIncome = 0;
        let totalItemExpense = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

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

        itemsData.forEach(item => {
            totalItemExpense += item.ItemExpense;
        });

        const formattedData = {
            name: moment(startOfMonth).format('MMM'),
            Expense: parseFloat(totalItemExpense.toFixed(2)),
            Income: parseFloat(totalOrderIncome.toFixed(2)),
        };

        return formattedData;
    } catch (error) {
        console.error(`Error fetching monthly report: ${error.message}`);
        return error;
    }
}

const getCombinedMonthlyExpense = async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const posMonthlyExpense = await getPosMonthlyExpenseData(restaurantId);

        console.log(posMonthlyExpense);

        const waiterMonthlyExpense = await getWaiterMonthlyExpenseAdminData(restaurantId);

        console.log(waiterMonthlyExpense);

        const combinedData = {
            name: 'monthly',
            Expense: parseFloat((posMonthlyExpense.Expense + waiterMonthlyExpense.Expense).toFixed(2)),
            Income: parseFloat((posMonthlyExpense.Income + waiterMonthlyExpense.Income).toFixed(2))
        };

        res.json(combinedData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}






const getPosDailyExpenseData = async (restaurantId) => {
    // const { restaurantId } = req.params;
    try {
        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        // const timeZone = currentDateResult[0].time_zone;
        // const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        // const twentyFourHoursAgo = moment(currentDate).subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        // Combine the current date with the opening time
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

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
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, openingTime]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(openingTime).format('D'),
                Expense: 0,
                Income: 0
            };
            return formattedData;
        }

        let totalIncome = 0;

        ordersData.forEach(order => {
            totalIncome += order.Income;
        });

        const formattedData = {
            name: moment(openingTime).format('D'),
            Expense: 0,
            Income: parseFloat(totalIncome.toFixed(2))
        };

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

        itemsData.forEach(item => {
            formattedData.Expense += item.Expense;
        });

        return formattedData;
    } catch (error) {
        console.error(`Error fetching current daily data: ${error.message}`);
        return error;
    }
}

const getWaiterDailyExpenseAdminData = async (restaurantId) => {
    try {
        const currentDateQuery = `SELECT time_zone, open_time FROM restaurants WHERE restaurant_id = ?`;
        const currentDateResult = await poolConnection.query(currentDateQuery, [restaurantId]);

        if (!currentDateResult[0] || currentDateResult[0].time_zone === null) {
            throw new Error("Time zone not available for the restaurant");
        }

        // const timeZone = currentDateResult[0].time_zone;
        // const currentDate = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

        // const startOf24HoursAgo = moment(currentDate).subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

        const { time_zone, open_time } = currentDateResult[0];
        const timeZone = time_zone;

        // Combine the current date with the opening time
        const openingTime = moment.tz(timeZone).startOf('day').format('YYYY-MM-DD') + ' ' + open_time;

        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.time,
                o.after_tax AS OrderIncome
            FROM 
                orders o
            WHERE 
                o.restaurant_id = ?
                AND o.time >= ?
            ORDER BY 
                o.time;
        `;
        const ordersData = await poolConnection.query(ordersQuery, [restaurantId, openingTime]);

        if (ordersData.length === 0) {
            const formattedData = {
                name: moment(openingTime).format('D'),
                Expense: 0,
                Income: 0
            };
            return formattedData;
        }
        let totalOrderIncome = 0;

        ordersData.forEach(order => {
            totalOrderIncome += order.OrderIncome;
        });

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

        let totalItemExpense = 0;

        itemsData.forEach(item => {
            totalItemExpense += item.ItemExpense;
        });

        const formattedData = {
            name: moment(openingTime).format('D'),
            Expense: parseFloat(totalItemExpense.toFixed(2)),
            Income: parseFloat(totalOrderIncome.toFixed(2)),
        };

        return formattedData;
    } catch (error) {
        console.error(`Error fetching daily report for admin: ${error.message}`);
        return error;
    }
}

const getCombinedDailyExpense = async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const posDailyExpense = await getPosDailyExpenseData(restaurantId);

        console.log(posDailyExpense);

        const waiterDailyExpense = await getWaiterDailyExpenseAdminData(restaurantId);

        console.log(waiterDailyExpense);

        const combinedData = {
            name: 'daily',
            Expense: parseFloat((posDailyExpense.Expense + waiterDailyExpense.Expense).toFixed(2)),
            Income: parseFloat((posDailyExpense.Income + waiterDailyExpense.Income).toFixed(2))
        };

        res.json(combinedData);
    } catch (error) {
        console.log(`Error! ${error.message}`);
        res.status(500).json({ status: 500, message: error.message });
    }
}



module.exports = {
    getPosMonthlyExpense,
    getPosWeeklyExpense,
    getPosDailyExpense,

    getWaiterMonthlyExpenseAdmin,
    getWaiterWeeklyExpenseAdmin,
    getWaiterDailyExpenseAdmin,

    getCombinedDailyExpense,
    getCombinedMonthlyExpense,

    getWaiterMonthlyExpenseAdminAllMonths
}
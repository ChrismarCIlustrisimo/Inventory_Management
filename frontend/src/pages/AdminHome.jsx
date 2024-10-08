import React, { useState, useEffect } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import { useAdminTheme } from "../context/AdminThemeContext";
import { GrRefresh } from "react-icons/gr";
import PieChartComponent from "../charts/PieChartComponent";
import { GoTriangleRight } from "react-icons/go";
import { FaCircle } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";
import { IoMdArrowDropdown } from "react-icons/io";
import BarChartComponent from "../charts/BarChartComponent";
import { GiWallet } from "react-icons/gi";
import { HiMiniWallet } from "react-icons/hi2";
import axios from "axios";
import { useAuthContext } from "../hooks/useAuthContext";
import { useNavigate } from 'react-router-dom';
import StatsCard from "../components/StatsCard";

const AdminHome = () => {
  const { darkMode } = useAdminTheme();
  const baseURL = "http://localhost:5555";
  const { user } = useAuthContext();
  const [topProducts, setTopProducts] = useState([]);
  const [grossSales, setGrossSales] = useState(0);
  const [Netsales, setNetSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productCount, setproductCount] = useState([]);
  const [transactionLog, setTransactionLog] = useState([]);
  const [openDropdown1, setOpenDropdown1] = useState(false);
  const [selectedOption1, setSelectedOption1] = useState("Last Month");
  const [openDropdown2, setOpenDropdown2] = useState(false);
  const [selectedOption2, setSelectedOption2] = useState("Last Month");
  const [totalBuyingPrice, setTotalBuyingPrice] = useState();
  const navigate = useNavigate();
  const [netSalesData, setNetSalesData] = useState([]);
  const [grossSalesData, setGrossSalesData] = useState([]);
  const [selectedOption, setSelectedOption] = useState('Select an option');
  const [openDropdown, setOpenDropdown] = useState(false); // Initialize dropdown state
  const [grossSalesOption, setGrossSalesOption] = useState("Last 7 Days");
  const [openGrossSalesDropdown, setOpenGrossSalesDropdown] = useState(false);
  const [netSalesOption, setNetSalesOption] = useState("Last 7 Days"); // Change this to a valid option
  const [openNetSalesDropdown, setOpenNetSalesDropdown] = useState(false); // New state for net sales dropdown
  
  const toggleGrossSalesDropdown = () => {
    setOpenGrossSalesDropdown(!openGrossSalesDropdown);
  };
  
  const handleGrossSalesOptionSelect = (option) => {
    setGrossSalesOption(option);
    setOpenGrossSalesDropdown(false); // close dropdown after selection
  };
  
  const toggleNetSalesDropdown = () => {
    setOpenNetSalesDropdown(!openNetSalesDropdown);
  };
  
  const handleNetSalesOptionSelect = (option) => {
    setNetSalesOption(option);
    setOpenNetSalesDropdown(false); // close dropdown after selection
  };

  const getDateRange = (option) => {
    const now = new Date();
  
    switch (option) {
      case 'Last 7 Days':
        const startOfLast7Days = new Date(now);
        startOfLast7Days.setDate(now.getDate() - 6); // 6 days ago
        return {
          start: startOfLast7Days,
          end: now,
        };
  
      case 'Last 30 Days':
        const startOfLast30Days = new Date(now);
        startOfLast30Days.setDate(now.getDate() - 29); // 29 days ago
        return {
          start: startOfLast30Days,
          end: now,
        };
  
      case 'This Year':
        const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of the current year
        return {
          start: startOfYear,
          end: now,
        };
  
      case 'Custom Date':
        // Handle custom date logic here, if needed
        return {
          start: null, // Replace with actual custom start date
          end: null, // Replace with actual custom end date
        };
  
      default:
        return {
          start: null,
          end: null,
        };
    }
  };
  


  // Function to refresh the page
  const handleRefresh = () => {
    window.location.reload();
  };

  // Stock color mapping
  const stockColors = {
    "HIGH": "#28a745", // Green
    "NEAR LOW": "#fd7e14", // Orange
    "LOW": "#ffc107", // Yellow
    "OUT OF STOCK": "#dc3545", // Red
  };
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };
  

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const fetchTopSellingProducts = async () => {
    try {
      // Add sorting query parameters to the request
      const response = await axios.get(`${baseURL}/product`, {
        params: {
          sortBy: "sales", // Sort by sales
          sortOrder: "desc", // Descending order
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.status !== 200) {
        throw new Error("Network response was not ok");
      }

      const result = response.data;
      setproductCount(result.count);

      // Filter out products with sales equal to 0 and slice to get only the top 5 products
      const top5Products = result.data
        .filter((product) => product.sales > 0) // Exclude products with zero sales
        .slice(0, 5).sort((a, b) => b.sales - a.sales);

      setTopProducts(top5Products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

   // Move fetchTransactionData outside of useEffect
   const fetchTransactionData = async () => {
    const dateRange = getDateRange(netSalesOption);
  
    if (!dateRange.start || !dateRange.end) {
      console.error("Invalid date range.");
      return;
    }
  
    try {
      const response = await axios.get(`${baseURL}/transaction`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        params: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        },
      });
  
      const result = response.data;
      const paidTransactions = result.data.filter(transaction => transaction.payment_status === 'paid');
  
      // Calculate Gross Sales
      const grossSales = paidTransactions.reduce((total, transaction) => total + transaction.total_price, 0);
      console.log("Total Gross Sales:", grossSales);
  
      // Calculate Total Cost of Sold Products
      const totalCostOfSoldProducts = paidTransactions.reduce((total, transaction) => {
        const transactionCost = transaction.products.reduce((sum, product) => {
          return sum + (product.product.buying_price * product.quantity);
        }, 0);
        return total + transactionCost;
      }, 0);
  
      console.log("Total Cost of Sold Products:", totalCostOfSoldProducts);
  
      // Calculate Net Sales
      const netSales = grossSales - totalCostOfSoldProducts;
  
      console.log("Total Net Sales:", netSales);
  
      setTransactionLog(paidTransactions.slice(0, 3));
      setGrossSales(grossSales);
      setNetSales(netSales);
  
    } catch (error) {
      console.error("Error fetching transaction data:", error);
    }
  };
  
  
  
  

  // UseEffect for fetching transaction data based on token and selected option
  useEffect(() => {
    fetchTransactionData();
  }, [user.token, baseURL, netSalesOption]); // Include netSalesOption as a dependency

  // Fetch top selling products as before
  useEffect(() => {
    fetchTopSellingProducts();
  }, [baseURL, user.token]);
  
  

  const handleProductClick = (productId) => {
    navigate(`/update-product/${productId}`);
  };


  if (loading) return <p>Loading...</p>;

  return (
    <div className={`${darkMode ? "bg-light-BG" : "dark:bg-dark-BG"} h-auto flex gap-1 overflow-y-hidden`}>
      <DashboardNavbar />
      <div className="h-[145vh] w-[100vw] pt-[70px] px-4 flex flex-col">
        {/* Header Section */}
        <div className="w-full h-auto flex justify-between items-center mt-2">
          <p className={`font-bold text-3xl ${darkMode ? "text-light-TEXT" : "dark:text-dark-TEXT"}`}>Dashboard</p>
          <button onClick={handleRefresh} className={`text-2xl border px-2 py-2 rounded-lg ${darkMode ? "text-light-ACCENT border-light-ACCENT" : "text-dark-ACCENT border-dark-ACCENT"}`}>
            <GrRefresh />
          </button>
        </div>
  
        {/* Main Content */}
        <div className="flex gap-2 w-full h-[30%] py-2">
          {/* Pie Chart Section */}
          <div className={`${darkMode ? "bg-light-CARD text-light-TEXT" : "bg-dark-CARD text-dark-TEXT"} w-[60%] rounded-lg px-4 py-2`}>
            <p>Stock Level</p>
            <PieChartComponent />
          </div>
  
          {/* Top Selling Products Section */}
          <div className={`${darkMode ? "bg-light-CARD" : "bg-dark-CARD"} w-[40%] rounded-lg px-2`}>
            <div className="w-full h-[15%] flex items-center justify-between px-2">
              <p className={`text-2xl ${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>Top 5 Selling Products</p>
            </div>
            <div className="w-full h-[82%] flex flex-col gap-3 overflow-y-auto">
              {topProducts.map((item, index) => {
                const statusColor = stockColors[item.current_stock_status] || "#000000"; // Default to black if status is not found
                return (
                  <div
                    onClick={() => handleProductClick(item._id)}
                    key={index}
                    className={`flex items-center justify-start w-full h-[70px] px-2 py-4 gap-4 ${darkMode ? "bg-light-CARD1 border-light-ACCENT" : "bg-dark-CARD1 border-dark-ACCENT"} rounded-md border-b-2`}
                  >
                    <img src={`${baseURL}/images/${item.image.substring(14)}`} className="w-14 h-14 object-cover rounded-lg" alt={item.name} />
                    <div className="flex flex-col w-[80%]">
                      <p className={`text-sm ${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>{item.name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <p className={`${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>{item.category}</p>
                        <FaCircle className={`text-[0.65rem] ${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`} />
                        <p className={`${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>{item.quantity_in_stock} in stock</p>
                        <FaCircle className={`text-[0.65rem] ${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`} />
                        <p className={`${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`} style={{ color: statusColor }}>{item.current_stock_status}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[10%]">
                      <p className={`${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>{item.sales}</p>
                      <p className={`${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>Sales</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        <div className="flex items-center justify-center">
          <StatsCard
            title="TOTAL PRODUCT INVENTORY"
            value={productCount}
            icon={AiFillProduct}
            darkMode={darkMode}
          />

          <StatsCard
            title="TOTAL NET SALES"
            value={`₱ ${Math.round(Netsales) || 0}`}
            icon={HiMiniWallet}
            optionLabel="Select Timeframe"
            options={['Last 7 Days', 'Last 30 Days', 'This Year', 'Custom Date']}
            onOptionSelect={handleNetSalesOptionSelect}
            selectedOption={netSalesOption}
            darkMode={darkMode}
            toggleDropdown={() => setOpenNetSalesDropdown(!openNetSalesDropdown)}
            isDropdownOpen={openNetSalesDropdown}
          />

          <StatsCard
            title="TOTAL GROSS SALES"
            value={`₱ ${Math.round(grossSales)}`}
            icon={GiWallet}
            optionLabel="Select Timeframe"
            options={['Last 7 Days', 'Last 30 Days', 'This Year', 'Custom Date']}
            onOptionSelect={handleGrossSalesOptionSelect}
            selectedOption={grossSalesOption}
            darkMode={darkMode}
            toggleDropdown={() => setOpenGrossSalesDropdown(!openGrossSalesDropdown)}
            isDropdownOpen={openGrossSalesDropdown}
          />
        </div>

  
        {/* Transaction Log Section */}
        <div className="flex gap-2 w-full h-[45%] py-2">
          <div className={`${darkMode ? "bg-light-CARD" : "bg-dark-CARD"} w-[50%] rounded-lg`}>
            <div className="w-full h-[15%] flex items-center justify-between p-4">
              <p className={`text-2xl font-semibold ${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>Transaction Log</p>
            </div>
            <div className="w-full h-[82%] flex flex-col gap-3">
              <div className="h-[420px] overflow-y-auto px-4 flex flex-col gap-4">
                {transactionLog.length === 0 ? (
                  <div className={`w-full h-full flex items-center justify-center ${darkMode ? "text-light-TEXT" : "text-dark-TEXT"}`}>
                    <p className="text-2xl">No Transactions for this week</p>
                  </div>
                ) : (
                  <div className={`w-full h-[100%] flex flex-col gap-4 overflow-y-auto scrollbar-custom ${darkMode ? "bg-light-CARD" : "bg-dark-CARD"}`}>
                    {transactionLog.map((transaction) => (
                      <div key={transaction._id} className={`rounded-lg p-4 flex gap-4 cursor-pointer w-full ${darkMode ? "bg-light-CARD1" : "dark:bg-dark-CARD1"}`} onClick={() => handleTransactionClick(transaction.transaction_id)}>
                        <div className="flex justify-between items-center gap-2 w-full h-[100px]">
                          <div className="p-4 w-[70%] flex flex-col gap-2">
                            <h1 className={`text-2xl ${darkMode ? "text-light-ACCENT" : "dark:text-dark-ACCENT"}`}>{transaction.transaction_id}</h1>
                            {transaction.products.map((item, idx) => (
                              <p key={idx} className={`text-sm ${darkMode ? "text-light-TEXT" : "dark:text-dark-TEXT"}`}>
                                ({item.quantity}) {item.product.name}
                              </p>
                            ))}
                          </div>
                          <div className={`flex gap-6 w-[50%] justify-between ${darkMode ? "text-light-TABLE" : "dark:text-dark-TABLE"}`}>
                            <div className="flex flex-col gap-1">
                              <p className={`text-xs ${darkMode ? "text-light-PRIMARY" : "dark:text-dark-PRIMARY"}`}>DATE</p>
                              <p className={`text-xs ${darkMode ? "text-light-PRIMARY" : "dark:text-dark-PRIMARY"}`}>CUSTOMER</p>
                              <p className={`text-xs ${darkMode ? "text-light-PRIMARY" : "dark:text-dark-PRIMARY"}`}>TOTAL AMOUNT</p>
                            </div>
                            <div className={`flex flex-col gap-1 ${darkMode ? "text-light-TEXT" : "dark:text-dark-TEXT"}`}>
                              <p className="text-sm ml-auto">{formatDate(transaction.transaction_date)}</p>
                              <p className="text-sm ml-auto">{transaction.customer ? transaction.customer.name.toUpperCase() : "None"}</p>
                              <p className="text-sm ml-auto">₱ {transaction.total_price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
  
          <div className={`px-4 py-2 flex flex-col items-center justify-center ${darkMode ? "bg-light-CARD" : "bg-dark-CARD"} w-[50%] rounded-lg`}>
            
          </div>
        </div>
      </div>
    </div>
  );
}  

export default AdminHome;

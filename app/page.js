'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Clock, TrendingUp, Download, Lock, Eye, EyeOff, LogOut,
  BarChart3, Activity, UserCheck, UserX, AlertCircle, Sun, Moon,
  ChevronRight, Search, RefreshCw, Award, Target, Shield, Bell,
  Filter, ArrowUpDown, X, User, Info, BookOpen
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_ENDPOINT = '/api/proxy';
const AUTH_ENDPOINT = '/api/auth';
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Dashboard Tab Component - unchanged
// ... (keep all the existing component code as is, up to the ParentLogsTab component)

// Parent Logs Tab Component with enhanced data fetching
const ParentLogsTab = ({ darkMode, loading, logs: allLogs, userInfo, students, exportToCSV }) => {
  // Filter states for parent view
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeChild, setActiveChild] = useState('all'); // For multiple children
  
  // New state for parent's children
  const [parentChildren, setParentChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childError, setChildError] = useState('');

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    allLogsCount: 0,
    childLogsCount: 0,
    filteredLogsCount: 0,
    parentChildrenCount: 0,
    userInfoData: null
  });

  // Fetch parent's children when component mounts
  useEffect(() => {
    fetchParentChildren();
  }, []);

  const fetchParentChildren = async () => {
    setLoadingChildren(true);
    setChildError('');
    
    try {
      // First try to get children from userInfo directly
      if (userInfo?.children && Array.isArray(userInfo.children)) {
        console.log('Children found in userInfo:', userInfo.children);
        setParentChildren(userInfo.children);
        return;
      }
      
      // If not in userInfo, try to fetch from API
      const sessionToken = sessionStorage.getItem('sessionToken');
      if (!sessionToken) {
        throw new Error('No session token found');
      }
      
      console.log('Fetching parent children from API...');
      
      // Try different API endpoints
      const endpoints = [
        'getParentChildren',
        'getMyChildren',
        'getChildren'
      ];
      
      let childrenData = null;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${API_ENDPOINT}?action=${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.children) {
              childrenData = data;
              console.log(`Found children from ${endpoint}:`, data.children);
              break;
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          continue;
        }
      }
      
      if (childrenData?.children) {
        setParentChildren(childrenData.children);
        
        // Update userInfo in sessionStorage
        const updatedUserInfo = {
          ...userInfo,
          children: childrenData.children
        };
        sessionStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      } else {
        // If no children found, check if there's a studentId in userInfo (parent might be viewing their own child)
        if (userInfo?.studentId) {
          console.log('Using studentId from userInfo as child');
          setParentChildren([{
            studentId: userInfo.studentId,
            name: userInfo.fullName || userInfo.username,
            class: userInfo.class || 'Unknown',
            relationship: 'Self'
          }]);
        } else {
          setChildError('No children data found. The system may need to link children to your account.');
        }
      }
    } catch (error) {
      console.error('Error fetching parent children:', error);
      setChildError(`Failed to load children data: ${error.message}`);
    } finally {
      setLoadingChildren(false);
    }
  };

  // Filter logs to show only parent's children
  const childLogs = useMemo(() => {
    if (!parentChildren.length) {
      console.log('No children found for parent');
      return [];
    }
    
    const childIds = parentChildren.map(child => child.studentId);
    console.log('Looking for logs with child IDs:', childIds);
    
    const filteredLogs = allLogs.filter(log => {
      const matches = childIds.includes(log.studentId);
      return matches;
    });
    
    console.log('Child logs found:', filteredLogs.length, 'out of', allLogs.length);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      allLogsCount: allLogs.length,
      childLogsCount: filteredLogs.length,
      parentChildrenCount: parentChildren.length,
      userInfoData: userInfo
    }));
    
    return filteredLogs;
  }, [allLogs, parentChildren, userInfo]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('newest');
    setDateFilter({ startDate: '', endDate: '' });
    setStatusFilter('all');
    setActiveChild('all');
  };

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = [...childLogs];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.studentId.toLowerCase().includes(term) ||
        log.name.toLowerCase().includes(term) ||
        log.class.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(log => {
        const logDate = log.timestamp.split('T')[0];
        return logDate >= dateFilter.startDate;
      });
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(log => {
        const logDate = log.timestamp.split('T')[0];
        return logDate <= dateFilter.endDate;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Apply child filter
    if (activeChild !== 'all') {
      filtered = filtered.filter(log => log.studentId === activeChild);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      filteredLogsCount: filtered.length
    }));

    return filtered;
  }, [childLogs, searchTerm, sortOrder, dateFilter, statusFilter, activeChild]);

  // Get date range for default values
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Calculate child stats
  const childStats = useMemo(() => {
    const stats = {};
    
    parentChildren.forEach(child => {
      const childLogs = allLogs.filter(log => log.studentId === child.studentId);
      const todayLogs = childLogs.filter(log => log.timestamp.startsWith(today));
      const lastEntry = childLogs[0]; // Most recent log
      
      stats[child.studentId] = {
        name: child.name || 'Unknown',
        class: child.class || 'Unknown',
        totalLogs: childLogs.length,
        todayLogs: todayLogs.length,
        lastStatus: lastEntry?.status || 'NO LOGS',
        lastTime: lastEntry ? new Date(lastEntry.timestamp).toLocaleTimeString() : 'N/A',
        lastDate: lastEntry ? new Date(lastEntry.timestamp).toLocaleDateString() : 'N/A',
        relationship: child.relationship || 'Child'
      };
    });
    
    return stats;
  }, [allLogs, parentChildren, today]);

  // Debug view toggle
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome, {userInfo?.fullName || 'Parent'}!
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
              Monitor your {parentChildren.length > 1 ? 'children' : 'child'}'s attendance records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              title="Debug info"
            >
              <Info size={18} />
              Debug
            </button>
            <button
              onClick={() => exportToCSV(filteredLogs)}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>
        
        {/* Debug Information */}
        {showDebug && (
          <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
            <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
              Debug Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Logs:</span>
                <span className="ml-2 font-semibold">{debugInfo.allLogsCount}</span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Children:</span>
                <span className="ml-2 font-semibold">{debugInfo.parentChildrenCount}</span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Child Logs:</span>
                <span className="ml-2 font-semibold">{debugInfo.childLogsCount}</span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Filtered Logs:</span>
                <span className="ml-2 font-semibold">{debugInfo.filteredLogsCount}</span>
              </div>
              {parentChildren.length > 0 && (
                <div className="col-span-2">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Child IDs:</span>
                  <span className="ml-2 font-semibold">
                    {parentChildren.map(c => c.studentId).join(', ')}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 space-y-2">
              <details className="text-xs">
                <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                  View User Info
                </summary>
                <pre className="mt-2 p-2 bg-black/30 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.userInfoData || userInfo, null, 2)}
                </pre>
              </details>
              <details className="text-xs">
                <summary className="cursor-pointer text-green-400 hover:text-green-300">
                  View Children Data
                </summary>
                <pre className="mt-2 p-2 bg-black/30 rounded overflow-auto max-h-40">
                  {JSON.stringify(parentChildren, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Loading State for Children */}
      {loadingChildren && (
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <div className="text-center">
            <RefreshCw size={48} className={`mx-auto mb-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading children data...</p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Please wait while we fetch your children's information
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {childError && !loadingChildren && (
        <div className={`${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className={`mt-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <div>
              <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                Children Data Not Available
              </h3>
              <p className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{childError}</p>
              <div className="mt-4 space-y-3">
                <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Possible solutions:</p>
                <ol className={`text-sm space-y-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} ml-4`}>
                  <li className="flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>Contact school administration to link children to your account</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <RefreshCw size={16} />
                    <button 
                      onClick={fetchParentChildren}
                      className="underline hover:no-underline"
                    >
                      Try reloading children data
                    </button>
                  </li>
                  <li className="flex items-center gap-2">
                    <Info size={16} />
                    <button 
                      onClick={() => setShowDebug(true)}
                      className="underline hover:no-underline"
                    >
                      Check debug information for details
                    </button>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Children Summary Cards */}
      {!loadingChildren && !childError && parentChildren.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parentChildren.map((child, idx) => {
            const stats = childStats[child.studentId] || {};
            return (
              <div 
                key={idx} 
                className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl transform hover:scale-105 transition-all duration-300 ${
                  activeChild === child.studentId ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveChild(activeChild === child.studentId ? 'all' : child.studentId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      stats.lastStatus === 'IN' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      stats.lastStatus === 'OUT' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                      'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {child.name || 'Unknown'}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {child.class || 'Unknown'} • {child.studentId || 'No ID'}
                        {child.relationship && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                            {child.relationship}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    stats.lastStatus === 'IN' ? 'bg-green-500 text-white' :
                    stats.lastStatus === 'OUT' ? 'bg-red-500 text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {stats.lastStatus || 'NO DATA'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Today's Logs</span>
                    <span className="font-semibold">{stats.todayLogs || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Records</span>
                    <span className="font-semibold">{stats.totalLogs || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Last Check</span>
                    <span className="font-semibold">{stats.lastTime || 'N/A'}</span>
                  </div>
                  {stats.lastDate && stats.lastDate !== 'N/A' && (
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Date</span>
                      <span className="font-semibold">{stats.lastDate}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : !loadingChildren && !childError ? (
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <div className="text-center">
            <User size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No Children Assigned
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No children are currently assigned to your account.
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={fetchParentChildren}
                className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all transform hover:scale-105"
              >
                <RefreshCw size={18} />
                Reload Children Data
              </button>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Please contact the school administration to link your children to your account.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter Controls for Parents - Only show if we have children */}
      {parentChildren.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Filter Attendance Records
            </h3>
            <span className={`text-sm px-2 py-1 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
              {filteredLogs.length} of {childLogs.length} records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Child Filter */}
            {parentChildren.length > 1 && (
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Child
                </label>
                <select
                  value={activeChild}
                  onChange={(e) => setActiveChild(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="all">All Children</option>
                  {parentChildren.map((child, idx) => (
                    <option key={idx} value={child.studentId}>
                      {child.name || 'Unknown'} ({child.class || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Search
              </label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search records..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sort Order
              </label>
              <div className="relative">
                <ArrowUpDown className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm appearance-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">All Status</option>
                <option value="IN">IN Only</option>
                <option value="OUT">OUT Only</option>
              </select>
            </div>
          </div>

          {/* Date Range Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Date
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                max={today}
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                End Date
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                max={today}
                min={dateFilter.startDate}
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quick Presets
              </label>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'today') {
                    setDateFilter({ startDate: today, endDate: today });
                  } else if (value === 'week') {
                    setDateFilter({ startDate: oneWeekAgo, endDate: today });
                  } else if (value === 'month') {
                    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setDateFilter({ startDate: oneMonthAgo, endDate: today });
                  }
                }}
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select Range</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
            <div>
              {(searchTerm || dateFilter.startDate || dateFilter.endDate || statusFilter !== 'all' || activeChild !== 'all') && (
                <div>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {dateFilter.startDate && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'}`}>
                        From: {dateFilter.startDate}
                      </span>
                    )}
                    {dateFilter.endDate && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'}`}>
                        To: {dateFilter.endDate}
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                        Status: {statusFilter}
                      </span>
                    )}
                    {activeChild !== 'all' && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600'}`}>
                        Child: {parentChildren.find(c => c.studentId === activeChild)?.name || 'Unknown'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
            >
              <X size={18} />
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      {parentChildren.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw size={48} className={`mx-auto mb-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading records...</p>
              </div>
            ) : childLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No attendance records found for your children</p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  This could mean your children haven't logged any attendance yet
                </p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No records match your filters</p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Try changing your filter criteria or reset filters
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-700/50">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {filteredLogs.length} of {childLogs.length} records • 
                    {activeChild === 'all' ? ' All children' : ` ${parentChildren.find(c => c.studentId === activeChild)?.name || 'Unknown'}`}
                  </p>
                </div>
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Timestamp</th>
                      <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Child Name</th>
                      <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Class</th>
                      <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {filteredLogs.map((log, idx) => (
                      <tr key={idx} className={`${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.name}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.class}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            log.status === 'IN' 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-red-500/20 text-red-600 dark:text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main component - UPDATED fetchData function
// ... (keep the rest of the main component code as is, but update the fetchData function)

const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      console.log('Fetching dashboard data...', { startDate, endDate });

      // For parents, try to fetch parent-specific data
      if (userType === 'parent') {
        try {
          // Try to fetch parent dashboard data
          const parentDashboard = await secureApiCall('getParentDashboard', {
            startDate,
            endDate
          });

          console.log('Parent dashboard response:', parentDashboard);

          if (parentDashboard.success) {
            const fetchedLogs = parentDashboard.logs || [];
            const sortedLogs = fetchedLogs.sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            );

            setLogs(sortedLogs);
            setStudents(parentDashboard.children || []);
            
            setStats({
              totalStudents: parentDashboard.children?.length || 0,
              presentToday: parentDashboard.todayPresent || 0,
              absentToday: parentDashboard.todayAbsent || 0,
              attendanceRate: parentDashboard.attendanceRate || 0
            });

            calculateWeeklyData(fetchedLogs);
          } else {
            // Fallback to regular dashboard data
            console.log('Parent dashboard endpoint failed, using regular dashboard');
            await fetchDashboardData(startDate, endDate);
          }
        } catch (parentError) {
          console.error('Error fetching parent data, using dashboard:', parentError);
          await fetchDashboardData(startDate, endDate);
        }
      } else {
        // Teachers get the full dashboard data
        await fetchDashboardData(startDate, endDate);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      // Set default empty state
      setStudents([]);
      setLogs([]);
      setClasses([]);
      setStats({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

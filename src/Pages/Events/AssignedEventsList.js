import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useUser } from "../../Context/UserContext";
import useApi from "../../Hooks/useApi";
import Table from "../../CommonComponents/Table/Table";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  Users,
  Building
} from "lucide-react";
import "./AssignedEventsList.css";

const AssignedEventsList = () => {
  const { user, selectedOrganizationId, isViewingOwnOrganization, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [orgIdReady, setOrgIdReady] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("eventDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedOrganization, setSelectedOrganization] = useState("All");

  // Initialize orgIdReady
  useEffect(() => {
    if (userLoading) {
      setOrgIdReady(false);
      return;
    }
    
    const hasOrgId = selectedOrganizationId || user?.organizationId;
    if (hasOrgId) {
      setOrgIdReady(true);
    }
  }, [selectedOrganizationId, user?.organizationId, userLoading]);

  // API function to fetch assigned events
  const fetchAssignedEvents = useCallback(async () => {
    if (!orgIdReady) return [];
    
    const organizationId = selectedOrganizationId || user?.organizationId;
    const userId = user?.userId;
    
    const includeChildren = isViewingOwnOrganization() ? "&includeChildren=true" : "&includeChildren=false";
    
    const response = await fetchWithRefresh(
      `/apis/dashboard/assigned-events?orgid=${organizationId}&userid=${userId}${includeChildren}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Assigned events API failed");
    }
    
    const data = await response.json();
    return data.events || [];
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);

  // Use API hook
  const {
    data: eventsData,
    loading: loadingEvents,
    error: errorEvents,
    execute: executeEvents
  } = useApi(fetchAssignedEvents, [orgIdReady], false);

  // Execute API when dependencies change
  useEffect(() => {
    if (orgIdReady) {
      executeEvents();
    }
  }, [orgIdReady, executeEvents]);

  // Transform API data to match table format
  const allEvents = (eventsData || []).map((event) => ({
    id: event.id || event.eventId,
    status: event.status || "Active",
    eventName: event.eventName,
    collegeName: event.organizationName || event.collegeName || event.college || "Unknown",
    organizationId: event.organizationId || event.orgId || selectedOrganizationId || user?.organizationId,
    assignTo: event.assignedUsers?.map((user, index) => ({
      name: user.userName || user.name || user.fullName || `User ${index + 1}`,
      src: user.src || "",
      id: user.userId || user.id || `user-${index}`
    })) || [],
    eventDate: new Date(event.eventDate).toLocaleDateString("en-GB"),
    createdBy: {
      name: event.createdByUser?.fullName || event.createdByUser?.name || "Unknown",
      src: event.createdByUser?.src || "",
    },
    description: event.eventDescription,
    location: event.locationDetails,
    eventType: event.eventTypeDesc || "Event",
    rawData: event
  }));

  // Client-side filtering and search
  const filteredEvents = allEvents.filter(event => {
    // Status filter
    if (filter !== "All" && event.status !== filter) {
      return false;
    }
    
    // Organization filter
    if (selectedOrganization !== "All" && event.collegeName !== selectedOrganization) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.eventName?.toLowerCase().includes(searchLower) ||
        event.collegeName?.toLowerCase().includes(searchLower) ||
        event.eventType?.toLowerCase().includes(searchLower) ||
        event.createdBy?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Client-side pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const transformedEvents = filteredEvents.slice(startIndex, endIndex);

  // Get unique organizations for filter
  const uniqueOrganizations = [...new Set(allEvents.map(event => event.collegeName))];

  // Filter options for dropdown
  const filterOptions = [
    { label: "All", value: "All" },
    { label: "Active", value: "Active" },
    { label: "Completed", value: "Completed" },
    { label: "Cancelled", value: "Cancelled" }
  ];

  // Organization filter options
  const organizationOptions = [
    { label: "All Organizations", value: "All" },
    ...uniqueOrganizations.map(org => ({ label: org, value: org }))
  ];

  // Handle event click
  const handleEventClick = (event) => {
    if (event && (event.id || event.rawData?.id)) {
      navigate("/events/eventDetailPage", {
        state: {
          eventId: event.id || event.rawData?.id,
          mode: "view",
          eventData: event.rawData || event,
        },
      });
    } else {
      console.warn("Event missing required ID:", event);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (option) => {
    setFilter(option.value);
    setCurrentPage(1);
  };

  // Handle organization filter change
  const handleOrganizationFilterChange = (option) => {
    setSelectedOrganization(option.value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Render cell content
  const renderCell = (column, event) => {
    switch (column) {
      case "assignTo":
        return (
          <div className="assigned-users">
            {event.assignTo?.slice(0, 3).map((user, index) => (
              <div key={index} className="user-avatar" title={user.name}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
            ))}
            {event.assignTo?.length > 3 && (
              <div className="more-users">+{event.assignTo.length - 3}</div>
            )}
          </div>
        );
      case "eventDate":
        const eventDate = new Date(event.rawData?.eventDate || event.eventDate);
        const today = new Date();
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let dateStatus = "";
        if (diffDays < 0) {
          dateStatus = "past";
        } else if (diffDays <= 7) {
          dateStatus = "upcoming";
        }
        
        return (
          <span className={`event-date ${dateStatus}`}>
            {event.eventDate}
            {diffDays !== undefined && (
              <span className="days-until">
                {diffDays < 0 ? `${Math.abs(diffDays)} days ago` : 
                 diffDays === 0 ? 'Today' : 
                 diffDays <= 7 ? `In ${diffDays} days` : ''}
              </span>
            )}
          </span>
        );
      case "eventType":
        return (
          <span className="event-type-badge">
            {event.eventType}
          </span>
        );
      case "createdBy":
        return (
          <div className="created-by">
            <User size={14} />
            <span>{event.createdBy?.name}</span>
          </div>
        );
      default:
        return event[column] || "";
    }
  };

  // Show loading skeleton while user context is loading
  if (userLoading || !orgIdReady) {
    return <PageSkeleton type="event" />;
  }

  return (
    <div className="assigned-events-container">
      {/* Header */}
      <div className="assigned-events-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="title-section">
            
            <div>
              <h1>Events Assigned to Me</h1>
              <p>Manage all events assigned to you across organizations</p>
            </div>
          </div>
        </div>
        
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search events, organizations, or locations..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="filter-controls">
          
          
          <div className="filter-group">
            <label>Organization:</label>
            <CustomDropdown
              options={organizationOptions}
              defaultLabel={selectedOrganization}
              onSelect={handleOrganizationFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table_style">
        <Table
          columns={[
            { key: "eventName", label: "Event Name", sortable: true },
            { key: "collegeName", label: "Organization", sortable: true },
            { key: "eventType", label: "Type" },
            { key: "assignTo", label: "Team Members" },
            { key: "eventDate", label: "Event Date", sortable: true },
            { key: "createdBy", label: "Created By", sortable: true }
          ]}
          data={transformedEvents}
          renderCell={renderCell}
          sortableColumns={["eventName", "collegeName", "eventDate", "createdBy"]}
          showActions={false}
          onRowClick={handleEventClick}
          loading={loadingEvents}
          error={errorEvents}
          className="assigned-events-table"
          // Pagination props
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredEvents.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

     
    </div>
  );
};

export default AssignedEventsList;

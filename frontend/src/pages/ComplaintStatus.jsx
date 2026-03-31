import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Loader2,
  Search,
  Clock,
  Building2,
  AlertCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
  Calendar,
  Shield,
  Tag,
  ArrowRight,
  Inbox,
  X,
  Image,
  Paperclip,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Chatbot from "../components/Chatbot";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../contexts/AuthContext";
import VoiceInput from "../components/VoiceInput";
import "./ComplaintStatus.css";
import { API_URL } from "../lib/config";
const API_BASE_URL = API_URL;

const ComplaintStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, getStatusTranslation, getUrgencyTranslation } = useTranslation();
  const { user } = useAuth();
  const [complaintId, setComplaintId] = useState(id || "");
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // My Complaints state
  const [myComplaints, setMyComplaints] = useState([]);
  const [myComplaintsLoading, setMyComplaintsLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch user's complaints on mount
  useEffect(() => {
    if (user?.email) {
      fetchMyComplaints(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchComplaintStatus(id);
    }
  }, [id]);

  const fetchMyComplaints = async (email) => {
    setMyComplaintsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/complaints/by-email/${encodeURIComponent(email)}`
      );
      if (response.data.success) {
        setMyComplaints(response.data.complaints || []);
      }
    } catch (err) {
      console.error("Failed to fetch my complaints:", err);
    } finally {
      setMyComplaintsLoading(false);
    }
  };

  const fetchComplaintStatus = async (cid) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/complaints/${cid}`);
      if (response.data.success) {
        setComplaint(response.data.complaint);
      } else {
        setError(response.data.error || t("statusNotFound"));
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || t("statusFetchError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (complaintId.trim()) {
      fetchComplaintStatus(complaintId.trim());
    }
  };

  const handleVoiceTranscript = (transcript) => {
    const cleaned = transcript.trim().replace(/\s+/g, "");
    setComplaintId(cleaned);
    setTimeout(() => {
      if (cleaned) {
        fetchComplaintStatus(cleaned);
      }
    }, 500);
  };

  const handleCardClick = (c) => {
    setSelectedComplaint(c);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setTimeout(() => setSelectedComplaint(null), 300);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "#3b82f6",
      in_progress: "#f59e0b",
      escalated: "#ef4444",
      resolved: "#10b981",
      closed: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  const getStatusGradient = (status) => {
    const gradients = {
      open: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      in_progress: "linear-gradient(135deg, #f59e0b, #d97706)",
      escalated: "linear-gradient(135deg, #ef4444, #dc2626)",
      resolved: "linear-gradient(135deg, #10b981, #059669)",
      closed: "linear-gradient(135deg, #6b7280, #4b5563)",
    };
    return gradients[status] || gradients.closed;
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: "🔵",
      in_progress: "🟡",
      escalated: "🔴",
      resolved: "🟢",
      closed: "⚫",
    };
    return icons[status] || "⚫";
  };

  const getTimeRemainingColor = (hours) => {
    if (hours < 0) return "#ef4444";
    if (hours < 24) return "#f59e0b";
    return "#10b981";
  };

  const formatTimeRemaining = (hours) => {
    if (hours === null || hours === undefined) return t("statusNA");
    if (hours <= 0) return t("statusOverdue");
    const days = Math.floor(hours / 24);
    const hrs = Math.floor(hours % 24);
    if (days > 0) return `${days}d ${hrs}h remaining`;
    return `${hrs}h remaining`;
  };

  const truncateText = (text, maxLen = 100) => {
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + "…";
  };

  // Parse attachments from complaint data
  const getAttachments = (c) => {
    const src = c.attachments || c.images || c.imageUrls || [];
    if (Array.isArray(src)) {
      return src
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.url) return item.url;
          if (item?.src) return item.src;
          return null;
        })
        .filter(Boolean);
    }
    if (typeof src === "string") return [src];
    return [];
  };

  const URGENCY_COLORS = {
    low: { bg: "#f0fdf4", color: "#15803d" },
    medium: { bg: "#eff6ff", color: "#1d4ed8" },
    high: { bg: "#fff7ed", color: "#c2410c" },
    urgent: { bg: "#fef2f2", color: "#dc2626" },
  };

  // Detail view component (either selected from my complaints or from search)
  const renderDetailView = (c) => (
    <div className="status-card animate-in">
      <div className="status-header-section">
        <div>
          <h2>
            {t("statusComplaintId")}
            {c.id.slice(0, 8)}
          </h2>
          <p className="complaint-description">{c.description}</p>
        </div>
        <div
          className="status-badge-large"
          style={{
            backgroundColor: getStatusColor(c.status) + "20",
            color: getStatusColor(c.status),
          }}
        >
          {getStatusTranslation(c.status)}
        </div>
      </div>

      <div className="status-details">
        <div className="detail-card">
          <Building2 size={20} />
          <div>
            <span className="detail-label">{t("statusDepartment")}</span>
            <span className="detail-value">{c.current_department}</span>
          </div>
        </div>

        <div className="detail-card">
          <Clock size={20} />
          <div>
            <span className="detail-label">{t("statusTimeRemaining")}</span>
            <span
              className="detail-value"
              style={{
                color: getTimeRemainingColor(c.time_remaining_hours),
              }}
            >
              {c.time_remaining_hours !== null
                ? c.time_remaining_hours > 0
                  ? `${Math.floor(c.time_remaining_hours / 24)} ${t(
                      "days"
                    )}, ${Math.floor(c.time_remaining_hours % 24)} ${t(
                      "hours"
                    )}`
                  : t("statusOverdue")
                : t("statusNA")}
            </span>
          </div>
        </div>

        <div className="detail-card">
          <span className="detail-label">{t("statusUrgency")}</span>
          <span
            className={`urgency-badge urgency-${c.urgency}`}
            style={{
              backgroundColor: URGENCY_COLORS[c.urgency]?.bg || "#f1f5f9",
              color: URGENCY_COLORS[c.urgency]?.color || "#475569",
            }}
          >
            {getUrgencyTranslation(c.urgency)}
          </span>
        </div>

        {c.escalation_level !== "none" && (
          <div className="detail-card escalation-notice">
            <AlertCircle size={20} />
            <div>
              <span className="detail-label">{t("statusEscalation")}</span>
              <span className="detail-value">
                {c.escalation_level.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className="detail-card">
          <span className="detail-label">{t("statusLastUpdated")}</span>
          <span className="detail-value">
            {format(new Date(c.last_update), "PPpp")}
            <br />
            <small style={{ color: "var(--text-secondary)" }}>
              {formatDistanceToNow(new Date(c.last_update), {
                addSuffix: true,
              })}
            </small>
          </span>
        </div>

        {c.structured_category && (
          <div className="detail-card">
            <Tag size={20} />
            <div>
              <span className="detail-label">Category</span>
              <span className="detail-value">{c.structured_category}</span>
            </div>
          </div>
        )}

        {c.location && (
          <div className="detail-card">
            <MapPin size={20} />
            <div>
              <span className="detail-label">Location</span>
              <span className="detail-value">
                {[c.location.city, c.location.state]
                  .filter(Boolean)
                  .join(", ") || "Not specified"}
              </span>
            </div>
          </div>
        )}

        {c.created_at && (
          <div className="detail-card">
            <Calendar size={20} />
            <div>
              <span className="detail-label">Filed On</span>
              <span className="detail-value">
                {format(new Date(c.created_at), "PPpp")}
              </span>
            </div>
          </div>
        )}

        {/* Attachments / Images */}
        {(() => {
          const imgs = getAttachments(c);
          return imgs.length > 0 ? (
            <div className="detail-card" style={{ gridColumn: "1 / -1" }}>
              <Paperclip size={20} />
              <div>
                <span className="detail-label">Attachments ({imgs.length})</span>
                <div className="complaint-attachments-grid">
                  {imgs.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="complaint-attachment-thumb"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(img);
                      }}
                    >
                      <img
                        src={img}
                        alt={`Attachment ${idx + 1}`}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null;
        })()}
      </div>

      <div className="notification-section">
        <p>{t("statusNotification")}</p>
      </div>

      <div className="forum-link-section">
        <a href={`/forum/${c.id}`} className="forum-link">
          <MessageCircle size={20} />
          <div>
            <h3>{t("discussComplaint") || "Discuss & Vote"}</h3>
            <p>
              {t("forumLinkDescription") ||
                "Share your experience or vote if you have a similar incident"}
            </p>
          </div>
        </a>
      </div>
    </div>
  );

  return (
    <div className="complaint-status">
      <div className="status-header">
        <h1>{t("statusTitle")}</h1>
        <p>{t("statusSubtitle")}</p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <Search size={20} />
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={t("statusPlaceholder")}
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              disabled={loading}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" /> : t("statusSearch")}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-card">
          <AlertCircle size={24} />
          <div>
            <h3>{t("statusError")}</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Searched complaint detail */}
      {complaint && renderDetailView(complaint)}

      {complaint && (
        <Chatbot
          complaintId={complaint.id}
          citizenEmail={complaint.citizen_email}
        />
      )}

      {/* My Complaints Section */}
      <div className="my-complaints-section">
        <div className="my-complaints-header">
          <div className="my-complaints-title">
            <FileText size={24} />
            <h2>My Complaints</h2>
          </div>
          <span className="my-complaints-count">
            {myComplaints.length} {myComplaints.length === 1 ? "complaint" : "complaints"}
          </span>
        </div>

        {myComplaintsLoading ? (
          <div className="my-complaints-loading">
            <Loader2 className="spinner" size={32} />
            <p>Loading your complaints…</p>
          </div>
        ) : myComplaints.length === 0 ? (
          <div className="my-complaints-empty">
            <Inbox size={48} />
            <h3>No Complaints Filed</h3>
            <p>
              You haven't filed any complaints yet. File one from the home page
              to see it here.
            </p>
          </div>
        ) : (
          <div className="my-complaints-grid">
            {myComplaints.map((c, index) => (
              <div
                key={c.id}
                className="complaint-card"
                style={{
                  animationDelay: `${index * 0.06}s`,
                  "--status-color": getStatusColor(c.status),
                }}
                onClick={() => handleCardClick(c)}
              >
                <div
                  className="card-status-strip"
                  style={{ background: getStatusGradient(c.status) }}
                />
                <div className="card-content">
                  <div className="card-top-row">
                    <span className="card-id">
                      #{c.id.slice(0, 8)}
                    </span>
                    <span
                      className="card-status-chip"
                      style={{
                        backgroundColor: getStatusColor(c.status) + "18",
                        color: getStatusColor(c.status),
                        borderColor: getStatusColor(c.status) + "40",
                      }}
                    >
                      {getStatusIcon(c.status)}{" "}
                      {getStatusTranslation(c.status)}
                    </span>
                  </div>

                  <p className="card-description">
                    {truncateText(c.description, 120)}
                  </p>

                  {/* Card thumbnail if has images */}
                  {(() => {
                    const imgs = getAttachments(c);
                    return imgs.length > 0 ? (
                      <div className="card-image-preview">
                        <img
                          src={imgs[0]}
                          alt="Complaint"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                        {imgs.length > 1 && (
                          <span className="card-image-count">
                            <Image size={11} />
                            +{imgs.length - 1}
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}

                  <div className="card-meta-row">
                    {c.current_department && (
                      <span className="card-meta-chip">
                        <Building2 size={13} />
                        {c.current_department}
                      </span>
                    )}
                    {c.urgency && (
                      <span
                        className={`card-meta-chip urgency-chip urgency-${c.urgency}`}
                        style={{
                          backgroundColor: URGENCY_COLORS[c.urgency]?.bg || "#f1f5f9",
                          color: URGENCY_COLORS[c.urgency]?.color || "#475569",
                          borderColor: (URGENCY_COLORS[c.urgency]?.color || "#475569") + "40",
                        }}
                      >
                        <Shield size={13} />
                        {getUrgencyTranslation(c.urgency)}
                      </span>
                    )}
                  </div>

                  <div className="card-footer">
                    <span className="card-time">
                      <Clock size={13} />
                      {c.time_remaining_hours !== null &&
                      c.time_remaining_hours !== undefined ? (
                        <span
                          style={{
                            color: getTimeRemainingColor(
                              c.time_remaining_hours
                            ),
                          }}
                        >
                          {formatTimeRemaining(c.time_remaining_hours)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>
                          {c.created_at
                            ? formatDistanceToNow(new Date(c.created_at), {
                                addSuffix: true,
                              })
                            : ""}
                        </span>
                      )}
                    </span>
                    <span className="card-view-link">
                      View Details <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModalOpen && selectedComplaint && (
        <div
          className="detail-modal-overlay"
          onClick={closeDetailModal}
        >
          <div
            className="detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="detail-modal-close" onClick={closeDetailModal}>
              <X size={20} />
            </button>
            <div className="detail-modal-body">
              {renderDetailView(selectedComplaint)}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="image-preview-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="image-preview-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-preview-close"
              onClick={() => setPreviewImage(null)}
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Complaint attachment preview"
              className="image-preview-full"
            />
            <a
              href={previewImage}
              target="_blank"
              rel="noopener noreferrer"
              className="image-preview-link"
            >
              Open in new tab ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintStatus;

import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaThumbtack, FaCalendarAlt } from "react-icons/fa";
import { getNotices } from "../../services/supabaseService";
import styles from "../../styles/NoticeBoard.module.css";

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const noticesContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const data = await getNotices();
      setNotices(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notices:", err);
      setLoading(false);
    }
  };

  // Auto-scrolling effect
  useEffect(() => {
    if (!loading && notices.length > 0 && noticesContainerRef.current) {
      const container = noticesContainerRef.current;

      // Clear any existing interval
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }

      // Start scrolling after a delay
      const startScrolling = () => {
        scrollIntervalRef.current = setInterval(() => {
          // Only scroll if not hovered
          if (!isHoveredRef.current) {
            container.scrollTop += 1;

            // Reset to top when we've scrolled past all notices
            if (container.scrollTop >= container.scrollHeight / 2) {
              container.scrollTop = 0;
            }
          }
        }, 30); // Adjust speed here (lower = faster)
      };

      // Start scrolling after a delay
      const scrollTimer = setTimeout(startScrolling, 2000);

      // Clean up on unmount
      return () => {
        clearTimeout(scrollTimer);
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
      };
    }
  }, [loading, notices]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleNoticeClick = (link) => {
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  return (
    <div className={styles.noticeBoardContainer}>
      <div className={styles.boardHeader}>
        <h2 className={styles.boardTitle}>Notice Board</h2>
        <p className={styles.boardSubtitle}>
          Important announcements and updates
        </p>
      </div>

      <div className={styles.boardFrame}>
        {loading ? (
          <div className={styles.noNotices}>
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : notices.length > 0 ? (
          <div
            className={styles.noticesContainer}
            ref={noticesContainerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Original notices */}
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`${styles.noticeItem} ${
                  notice.is_important ? styles.important : ""
                }`}
              >
                <h3
                  className={styles.noticeTitle}
                  onClick={() => handleNoticeClick(notice.link)}
                  style={notice.link ? { cursor: "pointer" } : {}}
                >
                  {notice.is_important && (
                    <FaThumbtack className="text-danger me-2" />
                  )}
                  {notice.link ? (
                    <a
                      href={notice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notice.title}
                    </a>
                  ) : (
                    notice.title
                  )}
                </h3>
                <p className={styles.noticeDate}>
                  <FaCalendarAlt className="me-2" />
                  {formatDate(notice.created_at)}
                </p>
              </div>
            ))}
            {/* Duplicate notices for seamless looping */}
            {notices.map((notice) => (
              <div
                key={`${notice.id}-duplicate`}
                className={`${styles.noticeItem} ${
                  notice.is_important ? styles.important : ""
                }`}
              >
                <h3
                  className={styles.noticeTitle}
                  onClick={() => handleNoticeClick(notice.link)}
                  style={notice.link ? { cursor: "pointer" } : {}}
                >
                  {notice.is_important && (
                    <FaThumbtack className="text-danger me-2" />
                  )}
                  {notice.link ? (
                    <a
                      href={notice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notice.title}
                    </a>
                  ) : (
                    notice.title
                  )}
                </h3>
                <p className={styles.noticeDate}>
                  <FaCalendarAlt className="me-2" />
                  {formatDate(notice.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noNotices}>
            <div className={styles.noNoticesIcon}>📋</div>
            <h3>No Notices Available</h3>
            <p>Check back later for important announcements</p>
          </div>
        )}
      </div>

      <div className={styles.boardStand}></div>
    </div>
  );
};

export default NoticeBoard;

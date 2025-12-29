import React, { useEffect } from "react";
import styles from "./Toast.module.css";

const Toast = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${styles.show} ${styles[type]}`}>
        <div className={styles.toastBody}>
          <div className="d-flex justify-content-between align-items-center">
            <span>{message}</span>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close toast"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;

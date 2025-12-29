import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Row,
  Col,
  Collapse,
  Image,
} from "react-bootstrap";
import {
  getGalleryImages,
  addGalleryImage,
  removeGalleryImage,
  uploadFile,
} from "../../services/supabaseService";
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from "react-icons/fa";
import Toast from "../user/Toast";
import styles from "../../styles/Gallery.module.css";
import { sendGalleryNotification } from "../../services/notificationService";

const GalleryManager = ({ refreshTimestamp }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [openPanels, setOpenPanels] = useState({
    addCategory: true,
    manageCategories: true,
    manageImages: true,
  });

  // Database handled by supabaseService

  // Fetch existing gallery categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categoriesData = await getGalleryImages();
        setCategories(categoriesData);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load gallery categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [refreshTimestamp]); // This ensures the data is refreshed when the refresh button is clicked in the admin panel

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  // Toggle panel visibility
  const togglePanel = (panelKey) => {
    setOpenPanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      showToast("Please enter a category name", "error");
      return;
    }

    // Check if category already exists
    const existingCategories = getCategoryNames();
    if (existingCategories.includes(newCategory.trim())) {
      showToast("Category already exists", "error");
      return;
    }

    // In this implementation, categories are created dynamically when images are added
    // We'll just add the category to our local state for UI purposes
    try {
      // Add the new category to the categories list so it appears in the dropdown
      const newCategoryObj = {
        category: newCategory.trim(),
        images: [],
      };

      setCategories((prevCategories) => [...prevCategories, newCategoryObj]);
      setNewCategory("");
      showToast("Category added successfully!", "success");
    } catch (err) {
      console.error("Error adding category:", err);
      showToast("Failed to add category", "error");
    }
  };

  const handleImageUpload = async () => {
    const categoryToUse = selectedCategory || newCategory;

    if (!imageFile) {
      showToast("Please select an image to upload", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit", "error");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(imageFile.type)) {
      showToast(
        "Please upload a valid image file (JPEG, JPG, PNG, GIF)",
        "error"
      );
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      // Upload image to Supabase Storage
      const uploadResult = await uploadFile(
        imageFile,
        "gallery",
        categoryToUse
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload image");
      }

      // Add image URL to the selected category in database
      const imageData = {
        category: categoryToUse,
        url: uploadResult.downloadURL,
      };

      await addGalleryImage(imageData);

      // Refresh categories to show the new image
      const categoriesData = await getGalleryImages();
      setCategories(categoriesData);

      setImageFile(null);
      setSelectedCategory("");
      setNewCategory("");
      showToast("Image uploaded successfully!", "success");

      // Send notification for new gallery images
      await sendGalleryNotification("add");
    } catch (err) {
      console.error("Error uploading image:", err);
      showToast("Failed to upload image: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      // Delete the image by its ID
      await removeGalleryImage(imageId);

      showToast("Image deleted successfully!", "success");
      // Refresh categories
      const categoriesData = await getGalleryImages();
      setCategories(categoriesData);

      // Send notification for updated gallery
      await sendGalleryNotification("update");
    } catch (err) {
      console.error("Error deleting image:", err);
      showToast("Failed to delete image: " + err.message, "error");
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the "${categoryName}" category? This will delete all images in this category.`
      )
    ) {
      return;
    }

    try {
      // Find all images in this category
      const category = categories.find((cat) => cat.category === categoryName);
      if (category && category.images) {
        // Delete all images in the category
        for (const image of category.images) {
          await removeGalleryImage(image.id);
        }
      }

      showToast(`Category "${categoryName}" deleted successfully!`, "success");
      // Refresh categories
      const categoriesData = await getGalleryImages();
      setCategories(categoriesData);

      // Send notification for updated gallery
      await sendGalleryNotification("update");
    } catch (err) {
      console.error("Error deleting category:", err);
      showToast("Failed to delete category: " + err.message, "error");
    }
  };

  // Get unique category names
  const getCategoryNames = () => {
    return Array.from(new Set(categories.map((cat) => cat.category)));
  };

  return (
    <div className={styles.galleryManager}>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Add Category Panel */}
      <Card className="mb-3">
        <Card.Header
          onClick={() => togglePanel("addCategory")}
          style={{ cursor: "pointer" }}
          className="d-flex justify-content-between align-items-center"
        >
          <h5 className="mb-0">Add New Category</h5>
          <div>
            {openPanels.addCategory ? <FaChevronDown /> : <FaChevronRight />}
          </div>
        </Card.Header>
        <Collapse in={openPanels.addCategory}>
          <div>
            <Card.Body>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Enter category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button
                  variant="primary"
                  className="ms-2"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim()}
                >
                  <FaPlus className="me-2" /> Add Category
                </Button>
              </div>
            </Card.Body>
          </div>
        </Collapse>
      </Card>

      {/* Upload Image Panel */}
      <Card className="mb-3">
        <Card.Header
          onClick={() => togglePanel("uploadImage")}
          style={{ cursor: "pointer" }}
          className="d-flex justify-content-between align-items-center"
        >
          <h5 className="mb-0">Upload Image</h5>
          <div>
            {openPanels.uploadImage ? <FaChevronDown /> : <FaChevronRight />}
          </div>
        </Card.Header>
        <Collapse in={openPanels.uploadImage}>
          <div>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Category</Form.Label>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Choose a category</option>
                      {getCategoryNames().map((categoryName) => (
                        <option key={categoryName} value={categoryName}>
                          {categoryName}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Or create a new category above and it will appear here
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Choose Image (Max 5MB)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                    />
                    <Form.Text className="text-muted">
                      Supported formats: JPEG, JPG, PNG, GIF. Max file size:
                      5MB.
                    </Form.Text>
                  </Form.Group>

                  <Button
                    variant="success"
                    onClick={handleImageUpload}
                    disabled={
                      uploading ||
                      (!selectedCategory && !newCategory) ||
                      !imageFile
                    }
                  >
                    {uploading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" /> Upload Image
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </div>
        </Collapse>
      </Card>

      {/* Manage Categories Panel */}
      <Card className="mb-3">
        <Card.Header
          onClick={() => togglePanel("manageCategories")}
          style={{ cursor: "pointer" }}
          className="d-flex justify-content-between align-items-center"
        >
          <h5 className="mb-0">
            Manage Categories ({getCategoryNames().length})
          </h5>
          <div>
            {openPanels.manageCategories ? (
              <FaChevronDown />
            ) : (
              <FaChevronRight />
            )}
          </div>
        </Card.Header>
        <Collapse in={openPanels.manageCategories}>
          <div>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" />
                  <p>Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <p>No categories found. Add a new category to get started.</p>
              ) : (
                <div>
                  {getCategoryNames().map((categoryName) => {
                    const category = categories.find(
                      (cat) => cat.category === categoryName
                    );
                    return (
                      <div
                        key={categoryName}
                        className={`d-flex justify-content-between align-items-center mb-2 p-3 border rounded ${styles.categoryItem}`}
                      >
                        <div>
                          <strong>{categoryName}</strong>
                          <div className="small text-muted">
                            {category && category.images
                              ? `${category.images.length} images`
                              : "0 images"}
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteCategory(categoryName)}
                        >
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </div>
        </Collapse>
      </Card>

      {/* Manage Images Panel */}
      {categories.length > 0 && (
        <Card className="mb-3">
          <Card.Header
            onClick={() => togglePanel("manageImages")}
            style={{ cursor: "pointer" }}
            className="d-flex justify-content-between align-items-center"
          >
            <h5 className="mb-0">Manage Images</h5>
            <div>
              {openPanels.manageImages ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </Card.Header>
          <Collapse in={openPanels.manageImages}>
            <div>
              <Card.Body>
                {getCategoryNames().map((categoryName) => {
                  const category = categories.find(
                    (cat) => cat.category === categoryName
                  );
                  return (
                    <div key={categoryName} className="mb-4">
                      <h6 className="mt-3">{categoryName}</h6>
                      {category &&
                      category.images &&
                      category.images.length > 0 ? (
                        <Row>
                          {category.images.map((image, index) => (
                            <Col
                              key={image.id || index}
                              md={3}
                              className="mb-3"
                            >
                              <Card className={styles.imageCard}>
                                <div
                                  style={{
                                    height: "150px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <Image
                                    variant="top"
                                    src={image.url}
                                    alt="Gallery image"
                                    style={{
                                      height: "100%",
                                      objectFit: "cover",
                                      width: "100%",
                                    }}
                                    onError={(e) => {
                                      e.target.src = "/assets/placeholder.png";
                                    }}
                                    thumbnail
                                  />
                                </div>
                                <Card.Body className="p-2">
                                  <div className="d-grid">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteImage(image.id)
                                      }
                                    >
                                      <FaTrash className="me-1" /> Delete
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <p className="text-muted">No images in this category</p>
                      )}
                    </div>
                  );
                })}
              </Card.Body>
            </div>
          </Collapse>
        </Card>
      )}
    </div>
  );
};

export default GalleryManager;

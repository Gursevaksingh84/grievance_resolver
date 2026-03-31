import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Loader2, Send, Camera, ImagePlus, X } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import VoiceInput from "./VoiceInput";
import "./ComplaintForm.css";
import { API_URL } from "../lib/config";
const API_BASE_URL = API_URL;

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ComplaintForm = ({ onSuccess, mapLocation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    description: "",
    citizen_name: "",
    citizen_email: "",
    citizen_phone: "",
    location: {
      country: "India",
      state: "",
      city: "",
      district: "",
      pincode: "",
      address: "",
    },
  });

  const [photos, setPhotos] = useState([]); // { file, preview, name }
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Auto-fill location fields when map location is selected
  useEffect(() => {
    if (mapLocation) {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          state: mapLocation.state || prev.location.state,
          city: mapLocation.city || prev.location.city,
          district: mapLocation.district || prev.location.district,
          pincode: mapLocation.pincode || prev.location.pincode,
          address: mapLocation.address || prev.location.address,
        },
      }));
    }
  }, [mapLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const locationField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        state: location.state || prev.location.state,
        city: location.city || prev.location.city,
        district: location.district || prev.location.district,
        pincode: location.pincode || prev.location.pincode,
        address: location.address || prev.location.address,
      },
    }));
  };

  const handleVoiceTranscript = (transcript) => {
    setFormData((prev) => ({
      ...prev,
      description: prev.description
        ? prev.description + " " + transcript
        : transcript,
    }));
  };

  // --- Photo handling ---
  const processFiles = (files) => {
    const fileList = Array.from(files);
    const remaining = MAX_PHOTOS - photos.length;

    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    const toAdd = fileList.slice(0, remaining);

    for (const file of toAdd) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Each photo must be under 5 MB.");
        return;
      }
    }

    setError(null);

    const newPhotos = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ""; // reset so same file can be re-selected
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Drag-and-drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Convert file to base64 data URL
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Convert photos to base64 data URLs
      const attachmentUrls = [];
      for (const photo of photos) {
        const base64 = await fileToBase64(photo.file);
        attachmentUrls.push(base64);
      }

      const response = await axios.post(`${API_BASE_URL}/api/complaints`, {
        description: formData.description,
        citizen_name: formData.citizen_name,
        citizen_email: formData.citizen_email,
        citizen_phone: formData.citizen_phone,
        location: formData.location,
        attachments: attachmentUrls,
      });

      if (response.data.success) {
        // Clean up preview URLs
        photos.forEach((p) => URL.revokeObjectURL(p.preview));
        onSuccess(response.data.complaint);
      } else {
        setError(response.data.error || t("formError"));
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || t("formErrorGeneric")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="complaint-form">
      <div className="form-group">
        <label htmlFor="citizen_name">{t("formYourName")}</label>
        <div className="input-wrapper">
          <input
            type="text"
            id="citizen_name"
            name="citizen_name"
            value={formData.citizen_name}
            onChange={handleInputChange}
            required
            placeholder={t("formNamePlaceholder")}
          />
          <VoiceInput
            onTranscript={(transcript) => {
              setFormData((prev) => ({
                ...prev,
                citizen_name: transcript,
              }));
            }}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="citizen_email">{t("formEmail")}</label>
          <input
            type="email"
            id="citizen_email"
            name="citizen_email"
            value={formData.citizen_email}
            onChange={handleInputChange}
            required
            placeholder={t("formEmailPlaceholder")}
          />
        </div>

        <div className="form-group">
          <label htmlFor="citizen_phone">{t("formPhone")}</label>
          <input
            type="tel"
            id="citizen_phone"
            name="citizen_phone"
            value={formData.citizen_phone}
            onChange={handleInputChange}
            required
            pattern="[0-9]{10}"
            placeholder={t("formPhonePlaceholder")}
            maxLength="10"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">{t("formDescription")}</label>
        <div className="textarea-wrapper">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows="6"
            placeholder={t("formDescriptionPlaceholder")}
          />
          <VoiceInput onTranscript={handleVoiceTranscript} disabled={loading} />
        </div>
        <small className="help-text">{t("formDescriptionHelp")}</small>
      </div>

      {/* Photo Upload Section */}
      <div className="form-group">
        <label>
          📷 Upload Photos <span className="optional-tag">(if applicable)</span>
        </label>

        <div
          className={`photo-upload-area ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {photos.length === 0 ? (
            <div className="photo-upload-placeholder">
              <ImagePlus size={32} strokeWidth={1.5} />
              <p>Drag & drop photos here, or</p>
              <div className="photo-upload-buttons">
                <button
                  type="button"
                  className="photo-btn photo-btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <ImagePlus size={16} />
                  <span>Choose File</span>
                </button>
                <button
                  type="button"
                  className="photo-btn photo-btn-camera"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={loading}
                >
                  <Camera size={16} />
                  <span>Take Photo</span>
                </button>
              </div>
              <small>Max {MAX_PHOTOS} photos · Under 5 MB each · JPG, PNG, WebP</small>
            </div>
          ) : (
            <div className="photo-previews">
              {photos.map((photo, index) => (
                <div key={index} className="photo-preview-card">
                  <img src={photo.preview} alt={`Upload ${index + 1}`} />
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => handleRemovePhoto(index)}
                    title="Remove photo"
                    disabled={loading}
                  >
                    <X size={14} />
                  </button>
                  <span className="photo-name">{photo.name}</span>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <div className="photo-add-more">
                  <button
                    type="button"
                    className="photo-btn photo-btn-add"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <ImagePlus size={20} />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    className="photo-btn photo-btn-add"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Camera size={20} />
                    <span>Camera</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="state">{t("formState")}</label>
          <select
            id="state"
            name="location.state"
            value={formData.location.state}
            onChange={handleInputChange}
          >
            <option value="">{t("formStatePlaceholder")}</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Delhi">Delhi</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="West Bengal">West Bengal</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="city">{t("formCity")}</label>
          <input
            type="text"
            id="city"
            name="location.city"
            value={formData.location.city}
            onChange={handleInputChange}
            placeholder={t("formCityPlaceholder")}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pincode">{t("formPincode")}</label>
          <input
            type="text"
            id="pincode"
            name="location.pincode"
            value={formData.location.pincode}
            onChange={handleInputChange}
            placeholder={t("formPincodePlaceholder")}
            pattern="[0-9]{6}"
            maxLength="6"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="spinner" />
            <span>{t("formProcessing")}</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>{t("formSubmit")}</span>
          </>
        )}
      </button>
    </form>
  );
};

export default ComplaintForm;

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import axios from "axios";
import API_BASE_URL from "../config/api.js";

const INITIAL_FORM_STATE = {
  title: "",
  desc: "",
  location: "",
  type: "Public",
  isAnonymous: false,
};

export default function AddComplaintPage() {
  const [preview, setPreview] = useState([]);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...INITIAL_FORM_STATE });

  const resetFormState = () => {
    setForm({ ...INITIAL_FORM_STATE });
    setFiles([]);
    setPreview([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const closeSuccessModal = () => {
    setSuccessDetails(null);
  };

  const handleViewComplaints = () => {
    closeSuccessModal();
    navigate("/student-dashboard/my-complaints");
  };

  const handleFileAnother = () => {
    closeSuccessModal();
    resetFormState();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const MAX_FILES = 3;
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "video/mp4",
      "video/quicktime",
    ];

    const allFiles = [...files];
    const newPreviews = [...preview];
    let newError = "";

    for (let file of newFiles) {
      const isDuplicate = allFiles.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (isDuplicate) {
        newError = `File "${file.name}" is already uploaded.`;
        continue;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        newError = "Only JPG, PNG, MP4, or MOV files are allowed.";
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        newError = `${file.name} exceeds 10MB limit.`;
        continue;
      }

      if (allFiles.length >= MAX_FILES) {
        newError = "You can upload up to 3 files only.";
        break;
      }

      allFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      newError = "Total upload size cannot exceed 20MB.";
    }

    setFiles(allFiles);
    setPreview(newPreviews);

    if (newError) {
      setErrors([newError]);
    } else {
      setErrors([]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreview = preview.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreview(updatedPreview);
    setErrors([]);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setPreview([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  /**
   * Normalize text for comparison: lowercase, remove punctuation, collapse spaces
   */
  const normalizeForComparison = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ')      // Collapse multiple spaces
      .trim();
  };

  /**
   * Tokenize text into words
   */
  const tokenize = (text) => {
    const normalized = normalizeForComparison(text);
    return normalized.split(/\s+/).filter(word => word.length > 0);
  };

  /**
   * Check if description has excessive word repetition (spam detection)
   * Only runs when description has >= 30 characters
   */
  const hasExcessiveRepetition = (description) => {
    const descLength = description.trim().length;
    
    // Only check if description has at least 30 characters
    if (descLength < 30) {
      return false;
    }

    const descWords = tokenize(description);
    const descWordCount = descWords.length;
    
    if (descWordCount === 0) {
      return false;
    }

    // Check for excessive word repetition within the description
    const wordCounts = {};
    descWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const frequencies = Object.values(wordCounts);
    if (frequencies.length === 0) {
      return false;
    }
    
    const maxFreq = Math.max(...frequencies);
    const uniqueWords = frequencies.length;
    
    // Check 1: Single word appears too many times
    // For short descriptions (< 50 words), threshold is 8
    // For longer descriptions, threshold scales with length
    const threshold = descWordCount < 50 ? 8 : Math.max(8, Math.floor(descWordCount * 0.15));
    if (maxFreq > threshold) {
      return true;
    }
    
    // Check 2: High repetition ratio (many words repeated)
    // If more than 40% of unique words are repeated (appear 2+ times), it's likely spam
    const repeatedWords = frequencies.filter(freq => freq >= 2).length;
    const repetitionRatio = repeatedWords / uniqueWords;
    if (descWordCount < 80 && repetitionRatio > 0.4 && maxFreq >= 3) {
      return true;
    }
    
    // Check 3: Very low vocabulary diversity (few unique words relative to total)
    const vocabularyRatio = uniqueWords / descWordCount;
    if (descWordCount >= 8 && vocabularyRatio < 0.5 && maxFreq >= 3) {
      return true;
    }
    
    // Check 4: Check for repeated phrases (2-3 word sequences)
    // This catches patterns like "fan problem fan problem fan problem"
    if (descWordCount >= 6) {
      const phraseCounts = {};
      // Check 2-word phrases
      for (let i = 0; i < descWords.length - 1; i++) {
        const phrase = `${descWords[i]} ${descWords[i + 1]}`;
        phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
      }
      
      const phraseFreqs = Object.values(phraseCounts);
      if (phraseFreqs.length > 0) {
        const maxPhraseFreq = Math.max(...phraseFreqs);
        // If a 2-word phrase appears 3+ times in a short description, it's repetitive
        if (descWordCount < 30 && maxPhraseFreq >= 3) {
          return true;
        }
        // For longer descriptions, allow more repetition but still flag excessive
        if (descWordCount >= 30 && descWordCount < 80 && maxPhraseFreq >= 4) {
          return true;
        }
      }
    }
    
    return false;
  };

  /**
   * Check if description is essentially a copy of the title
   * Only runs when description has >= 30 characters
   */
  const isDescriptionCopyOfTitle = (title, description) => {
    const descLength = description.trim().length;
    
    // Only check if description has at least 30 characters
    if (descLength < 30) {
      return false;
    }

    const titleWords = tokenize(title);
    const descWords = tokenize(description);
    const descWordCount = descWords.length;
    
    if (descWordCount === 0) {
      return false;
    }

    const titleWordSet = new Set(titleWords);
    
    // Count how many description words appear in title
    const overlapCount = descWords.filter(word => titleWordSet.has(word)).length;
    const overlapRatio = descWordCount > 0 ? overlapCount / descWordCount : 0;
    
    // Trigger error only if BOTH conditions are met:
    // 1. Description is relatively short (< 80 words)
    // 2. At least 90% of description words also appear in title
    if (descWordCount < 80 && overlapRatio >= 0.9) {
      return true;
    }
    
    return false;
  };

  const validateComplaintText = (title, desc) => {
    const errors = [];
    const clean = (text) =>
      text
        .normalize("NFKC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    // Step 1: Trim title and description
    const trimmedTitle = clean(title || '');
    const trimmedDesc = clean(desc || '');

    // Step 2: LENGTH CHECKS FIRST (before quality checks)
    // Title length validation (character-based)
    if (!trimmedTitle || trimmedTitle.length < 5) {
      errors.push("Title must be at least 5 characters long.");
    }
    if (trimmedTitle.length > 200) {
      errors.push("Title cannot exceed 200 characters.");
      // Return early - no need to check quality if length is invalid
      return { valid: errors.length === 0, errors };
    }

    // Description length validation
    const descLength = trimmedDesc.length;
    if (descLength < 30) {
      errors.push("Please describe your complaint in at least 30 characters.");
    }
    if (descLength > 3000) {
      errors.push("Description cannot exceed 3000 characters.");
      // Return early - no need to check quality if length is invalid
      return { valid: errors.length === 0, errors };
    }

    // Step 3: QUALITY CHECKS (only run if length is valid and >= 30 chars)
    // Run the "repeats the same words" check (only if descLength >= 30)
    if (descLength >= 30) {
      // Check if description is a copy of the title
      if (isDescriptionCopyOfTitle(trimmedTitle, trimmedDesc)) {
        errors.push("Complaint repeats the same words. Add more detail about the issue.");
      }
      // Check for excessive word repetition within the description
      else if (hasExcessiveRepetition(trimmedDesc)) {
        errors.push("Complaint repeats the same words. Add more detail about the issue.");
      }
    }

    // Character-repetition spam check (only if within length limits)
    if (descLength <= 3000 && /(.)\1{29,}/.test(trimmedDesc)) {
      errors.push(
        "Description has excessive repetition of a single character — please revise."
      );
    }

    // Ensuring that title has at least one visible alphanumeric character
    if (trimmedTitle && !/[A-Za-z0-9]/.test(trimmedTitle)) {
      errors.push("Title must contain at least one letter or number.");
    }

    // Ensuring that description has at least one visible alphanumeric character
    if (trimmedDesc && !/[A-Za-z0-9]/.test(trimmedDesc)) {
      errors.push("Description must contain at least one letter or number.");
    }

    return { valid: errors.length === 0, errors };
  };

  const submit = async (e) => {
    e.preventDefault();
    const { valid, errors: validationErrors } = validateComplaintText(
      form.title,
      form.desc
    );
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSubmitting(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem("ccms_token");

      if (!token) {
        setErrors(["You are not logged in. Please login again."]);
        setSubmitting(false);
        return;
      }

      // Use cleaned/trimmed values from validation (already validated)
      const clean = (text) =>
        text
          .normalize("NFKC")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      
      const cleanedTitle = clean(form.title || '');
      const cleanedDesc = clean(form.desc || '');
      const cleanedLocation = clean(form.location || '');

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("title", cleanedTitle);
      formData.append("description", cleanedDesc);
      formData.append("location", cleanedLocation);
      formData.append("type", form.type);
      formData.append("isAnonymous", form.isAnonymous ? "true" : "false");


      // Append files if any
      if (files.length > 0) {
        files.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      // Call API
      const { data } = await axios.post(
        `${API_BASE_URL}/complaints/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const complaintId = `CC${data.complaint._id.slice(-6).toUpperCase()}`;
      setSuccessDetails({
        complaintId,
        committee: data.routing.committee,
      });
      resetFormState();
    } catch (error) {
      console.error("Submit Complaint Error:", {
        response: error?.response,
        request: error?.request,
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });

      // Differentiate between different error types
      if (error.response) {
        // Server responded with 4xx/5xx
        const status = error.response.status;
        const backendMessage = error.response.data?.message;

        if (status === 400 && backendMessage?.toLowerCase().includes("spam")) {
          setErrors([backendMessage]);
        } else if (status === 400) {
          setErrors([backendMessage || "Invalid complaint data. Please check your input."]);
        } else if (status >= 500) {
          setErrors([backendMessage || "Server error while submitting complaint. Please try again."]);
        } else {
          setErrors([backendMessage || "Failed to submit complaint. Please try again."]);
        }
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        // Network error - server unreachable or connection reset
        setErrors(["Cannot reach the server. Please check your connection and try again."]);
      } else if (error.request) {
        // Request was made but no response received
        setErrors(["No response from server. The server may be restarting. Please wait a moment and try again."]);
      } else {
        // Something else happened
        setErrors([error?.message || "Unexpected error while submitting complaint. Please try again."]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {submitting && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
          data-testid="loading-modal-container"
        >
          <div 
            className="bg-white/95 border border-blue-100 rounded-2xl shadow-2xl p-6 max-w-sm w-[90%] text-center"
            data-testid="loading-modal-content"
          >
            <div 
              className="submission-spinner mx-auto mb-4" 
              aria-hidden="true"
              data-testid="loading-spinner"
            />
            <p 
              className="text-lg font-semibold text-gray-800"
              data-testid="loading-message-title"
            >
              Submitting your complaint
            </p>
            <p 
              className="text-sm text-gray-500 mt-2" 
              aria-live="assertive"
              data-testid="loading-message-subtitle"
            >
              We are encrypting your attachments and routing the complaint. This may take a few seconds.
            </p>
          </div>
        </div>
      )}

      {successDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          data-testid="success-modal-container"
        >
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={closeSuccessModal}
            data-testid="success-modal-backdrop"
          />
          <div 
            className="relative bg-white rounded-[32px] px-8 py-10 mx-4 w-full max-w-lg border border-blue-100 shadow-[0_28px_60px_rgba(15,23,42,0.18)] text-center"
            data-testid="success-modal-content"
          >
            <div 
              className="success-tick mx-auto mb-6" 
              aria-hidden="true"
              data-testid="success-tick-icon"
            />
            <p 
              className="text-xs font-semibold tracking-[0.35em] text-sky-500 uppercase"
              data-testid="success-label"
            >
              Success
            </p>
            <h2 
              className="text-2xl font-bold text-gray-900 mt-2"
              data-testid="success-title"
            >
              Complaint Submitted
            </h2>
            <p 
              className="text-sm text-gray-500 mt-3"
              data-testid="success-message"
            >
              We will notify you as progress is made. Keep an eye on your dashboard for updates.
            </p>

            <div 
              className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-8 text-left"
              data-testid="success-details-card"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Complaint ID
              </p>
              <p 
                className="text-xl font-semibold text-gray-900"
                data-testid="complaint-id-display"
              >
                {successDetails.complaintId}
              </p>
              <div className="mt-3 sm:mt-4">
                <p className="text-[10px] xs:text-xs text-gray-500 uppercase tracking-wide">
                  Routed to
                </p>
                <p 
                  className="text-base font-medium text-gray-800"
                  data-testid="routed-committee-display"
                >
                  {successDetails.committee}
                </p>
              </div>
            </div>

            <div className="mt-6 sm:mt-9 flex flex-col gap-2 sm:gap-3 xs:flex-row">
              <button
                onClick={handleViewComplaints}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
                data-testid="view-complaints-button"
              >
                View My Complaints
              </button>
              <button
                onClick={handleFileAnother}
                className="flex-1 border border-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-xl hover:bg-blue-50 transition-all"
                data-testid="file-another-button"
              >
                File Another
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        className="bg-white p-8 rounded-xl shadow-lg border border-gray-100"
        data-testid="add-complaint-form-container"
      >
      
        <h1 
          className="text-3xl font-bold text-gray-800 mb-2"
          data-testid="page-title"
        >
          File a New Complaint
        </h1>
        <br />
        <p 
          className="text-gray-600 mb-8"
          data-testid="page-description"
        >
          Please provide accurate and detailed information. The system will
          automatically route your complaint to the relevant committee.
        </p>
        <form 
          onSubmit={submit} 
          className="space-y-6"
          data-testid="complaint-form"
        >
          {/* Title */}
          <div data-testid="title-field-container">
            <label 
              className="block text-sm font-medium text-gray-700"
              data-testid="title-label"
            >
              Complaint Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={(e) => {
                // Restrict typing to max 200 chars
                if (e.target.value.length <= 200) {
                  handleChange(e);
                }
              }}
              maxLength={200}
              placeholder="e.g., Wi-Fi not working in Block B"
              className={`w-full mt-1 border ${
                errors.includes("Title must be at least 5 characters long.") ||
                errors.includes("Title cannot exceed 200 characters.")
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-lg px-3 py-2 text-sm sm:text-base`}
              required
              data-testid="title-input"
            />
            <div className="flex justify-between mt-1">
              <p
                className={`text-xs ${
                  form.title.length >= 180
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }`}
                data-testid="title-char-count"
              >
                {form.title.length} / 200 characters
                {form.title.length >= 200 && " — Character limit reached"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div data-testid="description-field-container">
            <label 
              className="block text-sm font-medium text-gray-700"
              data-testid="description-label"
            >
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="desc"
              value={form.desc}
              onChange={(e) => {
                // Only allow typing until 3000 characters
                if (e.target.value.length <= 3000) {
                  handleChange(e);
                }
              }}
              maxLength={3000} // ensures paste/hold typing is blocked beyond limit
              rows={6}
              placeholder="Describe the issue with sufficient detail and context."
              className={`w-full mt-1 border ${
                errors.some((err) => err.toLowerCase().includes("description"))
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-lg px-3 py-2 text-sm sm:text-base`}
              required
              data-testid="description-input"
            />
            <div className="flex justify-between mt-1">
              <p
                className={`text-xs ${
                  form.desc.length >= 2900
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }`}
                data-testid="description-char-count"
              >
                {form.desc.length} / 3000 characters
                {form.desc.length >= 3000 && " — Character limit reached"}
              </p>
            </div>
          </div>

          {/* Location */}
          <div data-testid="location-field-container">
            <label 
              className="block text-sm font-medium text-gray-700"
              data-testid="location-label"
            >
              Location (optional)
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g., Hostel A Room 214 / C-Block 2nd Floor"
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 "
              data-testid="location-input"
            />
          </div>

          {/* File Upload */}
          <div data-testid="attachments-field-container">
            <div className="flex justify-between items-center">
              <label 
                className="block text-sm font-medium text-gray-700"
                data-testid="attachments-label"
              >
                Attachments (optional)
              </label>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="text-xs text-red-500 hover:underline"
                  data-testid="remove-all-files-button"
                >
                  Remove all
                </button>
              )}
            </div>

            <label className="inline-block mt-2 cursor-pointer text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 py-2 px-3 sm:px-4 rounded-lg transition-all touch-manipulation">
              Choose Files
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileChange}
                accept=".jpg,.jpeg,.png,.mp4,.mov"
                className="hidden"
                data-testid="file-input"
              />
            </label>

            {errors.length > 0 &&
              errors.find((e) => e.toLowerCase().includes("file")) && (
                <p 
                  className="text-sm text-red-500 mt-1"
                  data-testid="file-error-message"
                >
                  {errors.find((e) => e.toLowerCase().includes("file"))}
                </p>
              )}

            {preview.length > 0 && (
              <div 
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3 justify-items-start"
                data-testid="file-preview-container"
              >
                {preview.map((src, i) => (
                  <div 
                    key={i} 
                    className="relative group w-full max-w-[200px]"
                    data-testid={`file-preview-item-${i}`}
                  >
                    {files[i].type.includes("image") ? (
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                        data-testid={`file-preview-link-${i}`}
                      >
                        <img
                          src={src}
                          alt={`Preview of ${files[i].name}`}
                          className="h-12 w-full object-cover rounded-lg shadow-sm border hover:opacity-90 transition"
                          data-testid={`file-preview-image-${i}`}
                        />
                      </a>
                    ) : (
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border rounded-lg px-2 py-1 text-xs text-gray-700 bg-gray-50 flex items-center justify-start h-16 xs:h-12 w-full overflow-hidden text-ellipsis whitespace-nowrap hover:bg-blue-50 active:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                        title={`Click to view ${files[i].name}`}
                        data-testid={`file-preview-video-${i}`}
                      >
                        📄{" "}
                        <span className="ml-1 truncate">{files[i].name}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-[3px] opacity-0 group-hover:opacity-100 transition focus:opacity-100 focus:ring-2 focus:ring-red-400"
                      title="Remove file"
                      data-testid={`remove-file-button-${i}`}
                    >
                      <FaTimes size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Complaint Type */}
          <div data-testid="complaint-type-field-container">
            <label 
              className="block text-sm font-medium text-gray-700"
              data-testid="complaint-type-label"
            >
              Is this complaint personal or public?
            </label>
            <p 
              className="text-xs text-gray-500 mb-2"
              data-testid="complaint-type-description"
            >
              Personal complaints are visible only to you and the concerned
              authority. Public complaints are visible to everyone (without
              revealing your identity) and can be upvoted.
            </p>
            <div className="flex gap-6 mt-1">
              <label 
                className="flex items-center gap-2"
                data-testid="type-personal-label"
              >
                <input
                  type="radio"
                  name="type"
                  value="Personal"
                  checked={form.type === "Personal"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                  data-testid="type-personal-radio"
                />
                <span className="text-xs sm:text-sm text-gray-700">Personal</span>
              </label>

              <label 
                className="flex items-center gap-2"
                data-testid="type-public-label"
              >
                <input
                  type="radio"
                  name="type"
                  value="Public"
                  checked={form.type === "Public"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                  data-testid="type-public-radio"
                />
                <span className="text-xs sm:text-sm text-gray-700">
                  Public (faced by many)
                </span>
              </label>
            </div>
          </div>

          {/* Submit Anonymously */}
          <div 
            className="mt-4"
            data-testid="anonymous-field-container"
          >
            <label 
              className="flex items-center gap-2 cursor-pointer"
              data-testid="anonymous-checkbox-label"
            >
              <input
                type="checkbox"
                name="isAnonymous"
                checked={form.isAnonymous || false}
                onChange={(e) =>
                setForm((prev) => ({ ...prev, isAnonymous: e.target.checked }))
              }
              className="h-4 w-4 text-blue-600"
              data-testid="anonymous-checkbox"
              />
              <span className="text-xs sm:text-sm text-gray-700">
                Submit Anonymously
                <span 
                  className="text-gray-500 block text-xs mt-1"
                  data-testid="anonymous-description"
                >
                Your identity will be hidden from committees and other users, 
                but your complaint will still be processed normally.
                </span>
              </span>
            </label>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              data-testid="error-container"
            >
              <p 
                className="text-sm font-medium text-red-800 mb-2"
                data-testid="error-title"
              >
                Please fix the following errors:
              </p>
              <ul 
                className="list-disc list-inside text-sm text-red-700 space-y-1"
                data-testid="error-list"
              >
                {errors.map((error, index) => (
                  <li 
                    key={index}
                    data-testid={`error-item-${index}`}
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 sm:pt-6 text-right">
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 sm:py-2 px-5 sm:px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:ring-4 focus:ring-blue-200 transition-all text-sm sm:text-base w-full xs:w-auto touch-manipulation ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
              data-testid="submit-complaint-button"
            >
              <FaPaperPlane />
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

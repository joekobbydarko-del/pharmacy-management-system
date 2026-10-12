

import {

  useCallback,

  useEffect,

  useRef,

  useState,

} from "react";



import {

  getStoredToken,

  getStoredUserId,

  getUserPrescriptions,

  getCurrentMedications,

} from "../api";



import "./PrescriptionsPage.css";



const API_BASE_URL =

  `http://${window.location.hostname}:8000`;



const MAX_FILE_SIZE = 5 * 1024 * 1024;



const ACTIVE_STATUSES = new Set([

  "active",

  "verified",

]);



const ALLOWED_EXTENSIONS = [

  ".pdf",

  ".png",

  ".jpg",

  ".jpeg",

];



// ============================================================*

// SVG ICONS*

// ============================================================*



function Icon({ name, size = 20 }) {

  const icons = {

    pill: (

      <>

        <path d="M10.5 5.5a5.66 5.66 0 0 1 8 8l-5 5a5.66 5.66 0 0 1-8-8z" />

        <path d="m8.5 8.5 7 7" />

      </>

    ),

    shield: (

      <>

        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />

        <path d="m9 12 2 2 4-4" />

      </>

    ),

    upload: (

      <>

        <path d="M12 16V3m-5 5 5-5 5 5" />

        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />

      </>

    ),

    file: (

      <>

        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />

        <path d="M14 2v6h6M8 13h8M8 17h8" />

      </>

    ),

    hospital: (

      <>

        <rect x="3" y="5" width="18" height="16" rx="2" />

        <path d="M9 5V3h6v2M12 9v7M8.5 12.5h7M7 21v-4h10v4" />

      </>

    ),

    user: (

      <>

        <circle cx="12" cy="7" r="4" />

        <path d="M4 21a8 8 0 0 1 16 0" />

      </>

    ),

    heart: (

      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />

    ),

    clipboard: (

      <>

        <rect x="4" y="5" width="16" height="17" rx="2" />

        <rect x="9" y="2" width="6" height="5" rx="1" />

        <path d="M8 12h8M8 16h8" />

      </>

    ),

    eye: (

      <>

        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

        <circle cx="12" cy="12" r="3" />

      </>

    ),

    checkCircle: (

      <>

        <circle cx="12" cy="12" r="9" />

        <path d="m8 12 3 3 5-6" />

      </>

    ),

    clock: (

      <>

        <circle cx="12" cy="12" r="9" />

        <path d="M12 7v5l3 2" />

      </>

    ),

    alert: (

      <>

        <path d="M10.3 4.3 2.1 18.5A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.5L13.7 4.3a2 2 0 0 0-3.4 0Z" />

        <path d="M12 9v5M12 17.5h.01" />

      </>

    ),

    info: (

      <>

        <circle cx="12" cy="12" r="9" />

        <path d="M12 11v5M12 7.5h.01" />

      </>

    ),

    trash: (

      <>

        <path d="M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v6M14 11v6" />

      </>

    ),

    chevron: <path d="m6 9 6 6 6-6" />,

    lock: (

      <>

        <rect x="5" y="10" width="14" height="11" rx="2" />

        <path d="M8 10V7a4 4 0 0 1 8 0v3" />

      </>

    ),

  };



  return (

    <svg

      width={size}

      height={size}

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.8"

      strokeLinecap="round"

      strokeLinejoin="round"

      aria-hidden="true"

    >

      {icons[name] || icons.file}

    </svg>

  );

}



// ============================================================*

// HELPERS*

// ============================================================*



function formatDate(value) {

  if (!value) return "Not available";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return "Not available";

  }



  return date.toLocaleDateString("en-GH", {

    day: "numeric",

    month: "short",

    year: "numeric",

  });

}



function formatDateTime(value) {

  if (!value) return "Not available";



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return "Not available";

  }



  return date.toLocaleString("en-GH", {

    day: "numeric",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

  });

}



function getVerificationStatus(document) {

  const verification = String(

    document.verification_status || "pending"

  ).toLowerCase();



  if (verification === "invalidated") {

    return {

      label: "Verification Invalidated",

      tone: "invalid",

      icon: "alert",

    };

  }



  if (verification === "verified") {

    return {

      label: "Pharmacist Verified",

      tone: "verified",

      icon: "checkCircle",

    };

  }



  if (document.extraction_status === "failed") {

    return {

      label: "Manual Review Required",

      tone: "invalid",

      icon: "alert",

    };

  }



  return {

    label: "Pending Verification",

    tone: "pending",

    icon: "clock",

  };

}



function getActiveMedications(records) {

  if (!Array.isArray(records)) return [];



  return records.filter((item) =>

    ACTIVE_STATUSES.has(

      String(item?.status || "").trim().toLowerCase()

    )

  );

}



function getErrorMessage(data, fallback) {

  if (typeof data?.detail === "string") return data.detail;

  if (typeof data?.message === "string") return data.message;



  return fallback;

}



async function medicationRequest(path, options = {}) {

  const token = getStoredToken();



  if (!token) {

    throw new Error(

      "Your session has expired. Please sign in again."

    );

  }



  let response;



  try {

    response = await fetch(`${API_BASE_URL}${path}`, {

      ...options,

      headers: {

        ...(options.headers || {}),

        Authorization: `Bearer ${token}`,

      },

    });

  } catch {

    throw new Error(

      "Unable to connect to the pharmacy server."

    );

  }



  const contentType =

    response.headers.get("content-type") || "";



  const data = contentType.includes("application/json")

    ? await response.json().catch(() => null)

    : null;



  if (!response.ok) {

    throw new Error(

      getErrorMessage(

        data,

        "Unable to complete this request."

      )

    );

  }



  return data;

}



// ============================================================*

// PROFESSIONAL CLINICAL DOCUMENT*

// ============================================================*



function DraftField({ label, value }) {

  const displayValue =

    typeof value === "string" ? value.trim() : "";



  return (

    <div className="med-draft-field">

      <span className="med-draft-field-label">

        {label}

      </span>

      <strong className={displayValue ? "" : "is-missing"}>

        {displayValue || "Not identified in transcription"}

      </strong>

    </div>

  );

}



function ProfessionalTranscription({

  document,

}) {

  const [showRaw, setShowRaw] = useState(false);



  const clinical = document.clinical_fields || {};

  const patient = clinical.patient || {};



  const medicines = Array.isArray(clinical.medications)

    ? clinical.medications

    : [];



  const status = String(

    document.verification_status || "pending"

  ).toLowerCase();



  const isVerified = status === "verified";

  const isInvalidated = status === "invalidated";



  function formatMedicineDetails(medicine) {

    const details = [

      medicine.dosage,

      medicine.frequency,

      medicine.instructions,

    ].filter(Boolean);



    return details.length

      ? details.join(" · ")

      : "Requires review of original prescription";

  }



  return (

    <div className="med-professional-review">

      <article className="med-draft-paper">

        <header className="med-draft-header">

          <span className="med-draft-emblem">

            <Icon name="clipboard" size={28} />

          </span>



          <div className="med-draft-title">

            <span>CLINICAL TRANSCRIPTION</span>

            <h3>Medical Prescription</h3>

            <p>Structured from the uploaded prescription</p>

          </div>



          <span

            className={`med-draft-status ${

              isVerified

                ? "is-verified"

                : isInvalidated

                  ? "is-invalid"

                  : ""

            }`}

          >

            <Icon

              name={

                isVerified

                  ? "checkCircle"

                  : isInvalidated

                    ? "alert"

                    : "clock"

              }

              size={15}

            />

            {isVerified

              ? "Pharmacist Verified"

              : isInvalidated

                ? "Invalidated"

                : "Unverified OCR Draft"}

          </span>

        </header>



        <div className="med-draft-reference">

          <span>

            <Icon name="file" size={15} />

            Document reference

          </span>

          <strong>

            {String(document.document_id || "").slice(0, 8) ||

              "Not available"}

          </strong>

        </div>



        {/* HOSPITAL / PHYSICIAN */}



        <section className="med-draft-section med-draft-hospital">

          <div className="med-draft-section-heading">

            <span className="med-draft-section-icon">

              <Icon name="hospital" size={21} />

            </span>

            <div>

              <small>SECTION 01</small>

              <h4>Hospital / Physician</h4>

            </div>

          </div>



          <div className="med-draft-field-grid">

            <DraftField

              label="Hospital / Clinic"

              value={clinical.hospital}

            />

            <DraftField

              label="Prescribing Physician"

              value={clinical.physician}

            />

          </div>

        </section>



        {/* PATIENT INFORMATION */}



        <section className="med-draft-section med-draft-patient">

          <div className="med-draft-section-heading">

            <span className="med-draft-section-icon">

              <Icon name="user" size={21} />

            </span>

            <div>

              <small>SECTION 02</small>

              <h4>Patient Information</h4>

            </div>

          </div>



          <div className="med-draft-field-grid">

            <DraftField

              label="Patient Name"

              value={patient.name}

            />

            <DraftField

              label="Age"

              value={patient.age}

            />

            <DraftField

              label="Sex"

              value={patient.sex}

            />

          </div>

        </section>



        {/* MEDICAL CONDITION */}



        <section className="med-draft-section med-draft-condition">

          <div className="med-draft-section-heading">

            <span className="med-draft-section-icon">

              <Icon name="heart" size={21} />

            </span>

            <div>

              <small>SECTION 03</small>

              <h4>Patient Medical Condition</h4>

            </div>

          </div>



          <div className="med-draft-condition-value">

            <p

              className={

                clinical.medical_condition

                  ? ""

                  : "is-missing"

              }

            >

              {clinical.medical_condition ||

                "Not identified in transcription"}

            </p>

          </div>

        </section>



        {/* PRESCRIPTIONS AND DOSAGE */}



        <section className="med-draft-section med-draft-medicines">

          <div className="med-draft-section-heading">

            <span className="med-draft-section-icon">

              <Icon name="pill" size={21} />

            </span>

            <div>

              <small>SECTION 04</small>

              <h4>Prescriptions & Dosage</h4>

            </div>

          </div>



          <div className="med-draft-table-wrap">

            <table className="med-draft-table">

              <thead>

                <tr>

                  <th scope="col">No.</th>

                  <th scope="col">Medication / Strength</th>

                  <th scope="col">Dosage / Instructions</th>

                </tr>

              </thead>



              <tbody>

                {medicines.length > 0 ? (

                  medicines.map((medicine, index) => (

                    <tr

                      key={`${index}-${medicine.medication || ""}`}

                    >

                      <td className="med-draft-number">

                        {String(index + 1).padStart(2, "0")}

                      </td>



                      <td>

                        <strong>

                          {medicine.medication ||

                            "Medication not identified"}

                        </strong>

                        {medicine.strength && (

                          <div>{medicine.strength}</div>

                        )}

                      </td>



                      <td>

                        {formatMedicineDetails(medicine)}

                        {Array.isArray(

                          medicine.unclassified_text

                        ) &&

                          medicine.unclassified_text.length > 0 && (

                            <div className="med-draft-unclassified">

                              Additional text requires checking

                              against the original prescription.

                            </div>

                          )}

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td

                      className="med-draft-table-empty"

                      colSpan={3}

                    >

                      No prescription medicines could be

                      confidently organized. The pharmacist

                      must examine the original document.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>



        {(() => {
          const unmatched = Array.isArray(clinical.unmatched_dosage_rows)
            ? clinical.unmatched_dosage_rows
            : (Array.isArray(clinical.unclassified_text)
                ? clinical.unclassified_text
                    .filter((line) => typeof line === "string" &&
                      line.startsWith("Unmatched dosage row:"))
                    .map((line) => line.slice("Unmatched dosage row:".length).trim())
                : []);
          const rows = [...new Set(unmatched.filter(Boolean))];
          return rows.length > 0 ? (
            <section className="med-draft-section med-draft-unmatched">
              <div className="med-draft-section-heading">
                <span className="med-draft-section-icon">
                  <Icon name="alert" size={21} />
                </span>
                <div>
                  <small>PHARMACIST REVIEW</small>
                  <h4>Dosage details requiring pharmacist matching</h4>
                </div>
              </div>
              <p className="med-draft-unmatched-intro">
                OCR detected the following dosage rows, but could not
                reliably match them to specific medicines. These are
                transcribed text only, not medication instructions.
              </p>
              <ol className="med-draft-unmatched-list">
                {rows.map((line, index) => (
                  <li key={`${index}-${line}`}>{line}</li>
                ))}
              </ol>
              <p className="med-draft-unmatched-note">
                Pharmacist must compare each row against the original
                prescription before assigning any dose to a medicine.
              </p>
            </section>
          ) : null;
        })()}

        <div className="med-draft-document-footer">

          <Icon name="shield" size={19} />

          <p>

            Automated transcription for pharmacist review.

            OCR may contain errors. All medication names,

            dosages and instructions must be checked against

            the original prescription before clinical use.

          </p>

        </div>

      </article>



      <div className="med-raw-document">

        <button

          type="button"

          className="med-raw-toggle"

          aria-expanded={showRaw}

          onClick={() => setShowRaw((value) => !value)}

        >

          <Icon name="file" size={18} />

          <span>

            {showRaw

              ? "Hide Complete OCR Text"

              : "View Complete OCR Text"}

          </span>

          <Icon name="chevron" size={17} />

        </button>



        {showRaw && (

          <pre className="med-raw-text">

            {document.extracted_text ||

              "No OCR text available."}

          </pre>

        )}

      </div>

    </div>

  );

}



// ============================================================*

// UPLOADED PRESCRIPTION RECORD*

// ============================================================*



function PrescriptionRecord({

  document,

  onDeleted,

}) {

  const [expanded, setExpanded] = useState(false);

  const [showOriginal, setShowOriginal] = useState(false);

  const [originalUrl, setOriginalUrl] = useState("");

  const [opening, setOpening] = useState(false);

  const [fileError, setFileError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [deleting, setDeleting] = useState(false);



  const previewUrlRef = useRef("");



  useEffect(() => {

    return () => {

      if (previewUrlRef.current) {

        URL.revokeObjectURL(previewUrlRef.current);

        previewUrlRef.current = "";

      }

    };

  }, []);



  const status = getVerificationStatus(document);



  const canDelete =

    document.extraction_status === "failed" &&

    document.verification_status === "pending" &&

    document.can_delete !== false;



  const hasTranscription =

    Boolean(document.extracted_text);



  async function viewOriginal() {

    if (showOriginal) {

      setShowOriginal(false);

      return;

    }



    if (originalUrl) {

      setShowOriginal(true);

      return;

    }



    if (opening) return;



    setOpening(true);

    setFileError("");



    try {

      const token = getStoredToken();



      if (!token) {

        throw new Error("Please sign in again.");

      }



      const response = await fetch(

        `${API_BASE_URL}/patient/medications/uploads/${encodeURIComponent(

          document.document_id

        )}/file`,

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );



      if (!response.ok) {

        throw new Error(

          "Unable to open the original prescription."

        );

      }



      const blob = await response.blob();

      const url = URL.createObjectURL(blob);



      previewUrlRef.current = url;

      setOriginalUrl(url);

      setShowOriginal(true);

    } catch (error) {

      setFileError(

        error.message || "Unable to open document."

      );

    } finally {

      setOpening(false);

    }

  }



  async function handleDelete() {

    if (!canDelete || deleting) return;



    setDeleting(true);

    setFileError("");



    try {

      await medicationRequest(

        `/patient/medications/uploads/${encodeURIComponent(

          document.document_id

        )}`,

        { method: "DELETE" }

      );



      setConfirmDelete(false);

      onDeleted(document.document_id);

    } catch (error) {

      setFileError(

        error.message || "Unable to delete upload."

      );

    } finally {

      setDeleting(false);

    }

  }



  return (

    <article className="med-record">

      <div className="med-record-header">

        <div className="med-record-identity">

          <span className="med-document-icon">

            <Icon name="file" size={22} />

          </span>



          <div>

            <h3>

              {document.filename || "Uploaded Prescription"}

            </h3>

            <p>

              Uploaded {formatDate(document.uploaded_at)}

            </p>

          </div>

        </div>



        <span

          className={`med-status med-status-${status.tone}`}

        >

          <Icon name={status.icon} size={14} />

          {status.label}

        </span>

      </div>



      {status.tone === "invalid" && (

        <div className="med-inline-warning" role="status">

          <Icon name="alert" size={19} />

          <span>

            {document.verification_status === "invalidated"

              ? "Verification was invalidated. This document is not an approved medication record."

              : "Text extraction failed. Manual pharmacist review of the original is required."}

          </span>

        </div>

      )}



      {hasTranscription ? (

        <div className="med-transcription">

          <div className="med-transcription-heading">

            <div className="med-transcription-title">

              <span className="med-transcription-symbol">

                <Icon name="clipboard" size={20} />

              </span>



              <div>

                <strong>

                  Professional Prescription Draft

                </strong>

                <small>

                  Clinical details extracted for pharmacist review

                </small>

              </div>

            </div>



            <button

              type="button"

              aria-expanded={expanded}

              onClick={() => setExpanded((value) => !value)}

            >

              {expanded ? "Hide Draft" : "View Professional Draft"}

              <Icon name="chevron" size={16} />

            </button>

          </div>



          {expanded && (

            <ProfessionalTranscription document={document} />

          )}

        </div>

      ) : (

        <p className="med-muted">

          No readable transcription is available.

          The original prescription can still be reviewed.

        </p>

      )}



      <div className="med-record-footer">

        <button

          type="button"

          className="med-secondary-button"

          onClick={viewOriginal}

          disabled={opening || deleting}

        >

          <Icon name="eye" size={17} />

          {opening

            ? "Opening..."

            : showOriginal

              ? "Hide Original"

              : "View Original Prescription"}

        </button>



        {canDelete && (

          <button

            type="button"

            className="med-danger-button"

            onClick={() => setConfirmDelete(true)}

            disabled={deleting}

          >

            <Icon name="trash" size={16} />

            Delete Failed Upload

          </button>

        )}

      </div>



      {fileError && (

        <div className="med-inline-warning" role="alert">

          <Icon name="alert" size={18} />

          <span>{fileError}</span>

        </div>

      )}



      {showOriginal && originalUrl && (

        <div className="med-document-preview">

          <div className="med-original-heading">

            <Icon name="eye" size={18} />

            <strong>Original Uploaded Prescription</strong>

          </div>



          {document.content_type === "application/pdf" ||

          /\.pdf$/i.test(document.filename || "") ? (

            <iframe

              title={`Prescription ${document.document_id}`}

              src={originalUrl}

            />

          ) : (

            <img

              src={originalUrl}

              alt="Original uploaded prescription"

            />

          )}

        </div>

      )}



      {confirmDelete && (

        <div className="med-modal-overlay">

          <div

            className="med-modal"

            role="alertdialog"

            aria-modal="true"

            aria-labelledby={`delete-${document.document_id}`}

          >

            <span className="med-modal-icon">

              <Icon name="trash" size={25} />

            </span>



            <h3 id={`delete-${document.document_id}`}>

              Delete Failed Prescription?

            </h3>



            <p>

              You are about to permanently delete{" "}

              <strong>{document.filename}</strong>.

              This action cannot be undone.

            </p>



            {fileError && (

              <div className="med-inline-warning" role="alert">

                {fileError}

              </div>

            )}



            <div className="med-modal-actions">

              <button

                type="button"

                className="med-secondary-button"

                onClick={() => setConfirmDelete(false)}

                disabled={deleting}

              >

                Cancel

              </button>



              <button

                type="button"

                className="med-danger-button"

                onClick={handleDelete}

                disabled={deleting}

              >

                <Icon name="trash" size={16} />

                {deleting ? "Deleting..." : "Delete Upload"}

              </button>

            </div>

          </div>

        </div>

      )}

    </article>

  );

}



// ============================================================*

// MY MEDICATIONS PAGE*

// ============================================================*



// A clinically-approved, pharmacist-verified medication card.

function VerifiedMedicationCard({ medication }) {

  return (

    <article

      key={medication.id}

      className="med-medicine-card"

    >

      <div className="med-medicine-top">

        <span className="med-pill-icon">

          <Icon name="pill" size={23} />

        </span>

        <span className="med-status med-status-active">

          <Icon name="checkCircle" size={14} />

          Pharmacist Verified

        </span>

      </div>



      <h3>{medication.medicine_name}</h3>



      <dl className="med-detail-grid">

        <div>

          <dt>Dosage</dt>

          <dd>

            {medication.dosage || "Not specified"}

          </dd>

        </div>

        <div>

          <dt>Frequency</dt>

          <dd>

            {medication.frequency || "Not specified"}

          </dd>

        </div>

      </dl>



      {medication.instructions && (

        <div className="med-instructions">

          <strong>

            <Icon name="info" size={17} />

            Recorded Instructions

          </strong>

          <p>{medication.instructions}</p>

        </div>

      )}



      <div className="med-verified-meta">

        <Icon name="shield" size={14} />

        <span>

          Verified by pharmacist

          {medication.verified_at

            ? ` · ${formatDateTime(medication.verified_at)}`

            : ""}

        </span>

      </div>

    </article>

  );

}



// An active record that has NOT been pharmacist-verified. Shown

// for transparency only; never presented as clinically approved.

function UnverifiedMedicationCard({ medication }) {

  return (

    <article

      key={medication.id}

      className="med-medicine-card med-medicine-card--unverified"

    >

      <div className="med-medicine-top">

        <span className="med-pill-icon">

          <Icon name="pill" size={23} />

        </span>

        <span className="med-status med-status-pending">

          <Icon name="clock" size={14} />

          Awaiting Verification

        </span>

      </div>



      <h3>{medication.medicine_name}</h3>



      <dl className="med-detail-grid">

        <div>

          <dt>Dosage</dt>

          <dd>

            {medication.dosage || "Not specified"}

          </dd>

        </div>

        <div>

          <dt>Frequency</dt>

          <dd>

            {medication.frequency || "Not specified"}

          </dd>

        </div>

      </dl>



      <div className="med-unverified-note">

        <Icon name="alert" size={14} />

        <span>

          Not yet verified by a pharmacist. Do not use

          until it has been reviewed.

        </span>

      </div>

    </article>

  );

}



function PrescriptionsPage() {

  const fileRef = useRef(null);

  const userId = getStoredUserId();



  const [medications, setMedications] = useState([]);

  const [uploads, setUploads] = useState([]);

  // Clinically-approved, pharmacist-verified medications.
  const [verifiedMedications, setVerifiedMedications] =
    useState([]);

  // Active records awaiting pharmacist verification. Shown for
  // transparency only; never presented as clinically approved.
  const [unverifiedMedications, setUnverifiedMedications] =
    useState([]);

  // True once the clinically-safe current-medications endpoint
  // has responded successfully.
  const [currentMedicationsLoaded, setCurrentMedicationsLoaded] =
    useState(false);

  // Set when the current-medications endpoint fails. When set,
  // the section shows an unavailable message and does NOT fall
  // back to legacy records or infer verification from status.
  const [currentMedicationsError, setCurrentMedicationsError] =
    useState("");

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const loadRecords = useCallback(async () => {

    if (!userId) {

      throw new Error(

        "Patient account information was not found."

      );

    }



    const [medicineData, uploadData, currentResult] =
      await Promise.all([

        getUserPrescriptions(userId),

        medicationRequest("/patient/medications/uploads"),

        // Clinically-safe current medications. We capture success
        // or failure explicitly so the UI can show an honest state
        // and never fall back to legacy records as approved.
        getCurrentMedications()
          .then((data) => ({ ok: true, data }))
          .catch((err) => ({
            ok: false,
            message:
              err?.message ||
              "Current medications are temporarily unavailable.",
          })),

      ]);



    setMedications(getActiveMedications(medicineData));

    setUploads(

      Array.isArray(uploadData) ? uploadData : []

    );

    if (currentResult && currentResult.ok) {

      const data = currentResult.data || {};

      setCurrentMedicationsLoaded(true);

      setCurrentMedicationsError("");

      setVerifiedMedications(

        Array.isArray(data.active_medications)

          ? data.active_medications

          : []

      );

      setUnverifiedMedications(

        Array.isArray(data.unverified_medications)

          ? data.unverified_medications

          : []

      );

    } else {

      setCurrentMedicationsLoaded(false);

      setCurrentMedicationsError(

        currentResult?.message ||

          "Current medications are temporarily unavailable."

      );

      setVerifiedMedications([]);

      setUnverifiedMedications([]);

    }

  }, [userId]);



  useEffect(() => {

    let cancelled = false;



    async function initialize() {

      try {

        await loadRecords();

      } catch (err) {

        if (!cancelled) {

          setError(

            err.message || "Unable to load medication records."

          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }



    initialize();



    return () => {

      cancelled = true;

    };

  }, [loadRecords]);



  function handleDeleted(documentId) {

    setUploads((current) =>

      current.filter(

        (record) => record.document_id !== documentId

      )

    );

    setError("");

    setSuccess("Failed upload deleted successfully.");

  }



  function selectFile(event) {

    setError("");

    setSuccess("");



    const file = event.target.files?.[0];



    if (!file) {

      setSelectedFile(null);

      return;

    }



    const validExtension = ALLOWED_EXTENSIONS.some(

      (extension) =>

        file.name.toLowerCase().endsWith(extension)

    );



    if (!validExtension) {

      setError("Choose a PDF, PNG or JPEG prescription.");

      setSelectedFile(null);

      event.target.value = "";

      return;

    }



    if (!file.size || file.size > MAX_FILE_SIZE) {

      setError("Your file must not exceed 5 MB.");

      setSelectedFile(null);

      event.target.value = "";

      return;

    }



    setSelectedFile(file);

  }



  async function handleUpload(event) {

    event.preventDefault();



    if (uploading) return;



    if (!selectedFile) {

      setError("Choose a prescription first.");

      return;

    }



    setUploading(true);

    setError("");

    setSuccess("");



    try {

      const formData = new FormData();

      formData.append("file", selectedFile);



      const result = await medicationRequest(

        "/patient/medications/upload",

        {

          method: "POST",

          body: formData,

        }

      );



      setSuccess(

        result?.message ||

          "Prescription uploaded successfully."

      );



      setSelectedFile(null);



      if (fileRef.current) {

        fileRef.current.value = "";

      }



      try {

        await loadRecords();

      } catch {

        setError(

          "Upload succeeded, but records could not refresh. Reload the page."

        );

      }

    } catch (err) {

      setError(

        err.message || "Unable to upload prescription."

      );

    } finally {

      setUploading(false);

    }

  }



  return (

    <div className="patient-medications-page">

      <header className="med-page-header">

        <div className="med-hero-copy">

          <div className="med-hero-kicker">

            <Icon name="shield" size={15} />

            DR. EVANS PHARMACY

            <span className="med-hero-dot" />

            PATIENT PORTAL

          </div>



          <h1>My Medications</h1>



          <p>

            Your medications, uploaded prescriptions and

            pharmacist-reviewed information, all in one place.

          </p>



          <div className="med-hero-feature-row">

            <span>

              <Icon name="checkCircle" size={15} />

              Personal Records

            </span>

            <span>

              <Icon name="clipboard" size={15} />

              Prescription Review

            </span>

          </div>

        </div>



        <div className="med-hero-emblem">

          <div className="med-hero-emblem-inner">

            <Icon name="pill" size={49} />

          </div>

        </div>

      </header>



      {error && (

        <div className="med-alert med-alert-error" role="alert">

          <Icon name="alert" size={19} />

          <span>{error}</span>

        </div>

      )}



      {success && (

        <div className="med-alert med-alert-success" role="status">

          <Icon name="checkCircle" size={19} />

          <span>{success}</span>

        </div>

      )}



      <section className="med-panel med-panel-medications">

        <div className="med-panel-heading">

          <div className="med-section-heading-group">

            <span className="med-section-icon med-icon-teal">

              <Icon name="pill" size={23} />

            </span>

            <div>

              <span className="med-eyebrow">

                PERSONAL MEDICATION RECORD

              </span>

              <h2>Current Medications</h2>

              <p>

                Medications verified by your pharmacist.

                Unverified records are shown separately and

                are not clinically approved.

              </p>

            </div>

          </div>



          <span className="med-count">

            {loading

              ? "Loading..."

              : currentMedicationsLoaded

                ? `${verifiedMedications.length} verified`

                : `${medications.length} recorded`}

          </span>

        </div>



        {loading ? (

          <div className="med-empty">

            Loading your medications...

          </div>

        ) : currentMedicationsError ? (

          /* The clinically-safe endpoint failed. Show an honest

             unavailable message. Do NOT display legacy records as

             approved and do NOT infer verification from status. */

          <div className="med-empty med-empty-error" role="alert">

            <Icon name="alert" size={30} />

            <strong>Medications temporarily unavailable</strong>

            <p>

              {currentMedicationsError} Please try again shortly.

              Your uploaded prescriptions are still listed below.

            </p>

          </div>

        ) : currentMedicationsLoaded ? (

          /* Clinically-safe view: only pharmacist-verified records

             are approved. Unverified active records are shown

             separately and are never promoted. */

          <div className="med-medication-stack">

            <div className="med-medication-grid">

              {verifiedMedications.length === 0 ? (

                <div className="med-empty">

                  <Icon name="shield" size={30} />

                  <strong>No verified medications yet</strong>

                  <p>

                    Medications appear here once a pharmacist

                    verifies your uploaded prescription.

                  </p>

                </div>

              ) : (

                verifiedMedications.map((medication) => (

                  <VerifiedMedicationCard

                    key={medication.id}

                    medication={medication}

                  />

                ))

              )}

            </div>

            {unverifiedMedications.length > 0 && (

              <div className="med-unverified-group">

                <div className="med-subsection-heading">

                  <span>

                    Awaiting Pharmacist Verification

                    ({unverifiedMedications.length})

                  </span>

                  <p>

                    These records have not been verified and are

                    not clinically approved.

                  </p>

                </div>

                <div className="med-medication-grid">

                  {unverifiedMedications.map((medication) => (

                    <UnverifiedMedicationCard

                      key={medication.id}

                      medication={medication}

                    />

                  ))}

                </div>

              </div>

            )}

          </div>

        ) : (

          <div className="med-empty">

            <Icon name="shield" size={30} />

            <strong>No verified medications yet</strong>

            <p>

              Medications appear here once a pharmacist verifies

              your uploaded prescription.

            </p>

          </div>

        )}

      </section>



      <section className="med-panel med-panel-upload">

        <div className="med-panel-heading">

          <div className="med-section-heading-group">

            <span className="med-section-icon med-icon-blue">

              <Icon name="upload" size={23} />

            </span>

            <div>

              <span className="med-eyebrow">

                ADD TO YOUR RECORDS

              </span>

              <h2>Upload Prescription</h2>

              <p>

                Upload a prescription for OCR transcription

                and pharmacist review

              </p>

            </div>

          </div>

        </div>



        <form

          className="med-upload-form"

          onSubmit={handleUpload}

        >

          <label

            className="med-upload-area"

            htmlFor="patient-prescription-file"

          >

            <span className="med-upload-symbol">

              <Icon name="upload" size={31} />

            </span>



            <strong>

              {selectedFile

                ? selectedFile.name

                : "Choose your prescription document"}

            </strong>



            <span className="med-upload-helper">

              Select a readable PDF or photograph

            </span>



            <span className="med-file-types">

              PDF, PNG, JPG, JPEG · Maximum 5 MB

            </span>

          </label>



          <input

            id="patient-prescription-file"

            ref={fileRef}

            type="file"

            className="med-file-input"

            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"

            disabled={uploading}

            onChange={selectFile}

          />



          <div className="med-upload-action-row">

            <p>

              <Icon name="info" size={16} />

              OCR content requires pharmacist verification.

            </p>



            <button

              type="submit"

              className="med-primary-button"

              disabled={uploading || !selectedFile}

            >

              <Icon name="upload" size={18} />

              {uploading

                ? "Uploading and processing..."

                : "Upload Prescription"}

            </button>

          </div>

        </form>

      </section>



      <section className="med-panel med-panel-prescriptions">

        <div className="med-panel-heading">

          <div className="med-section-heading-group">

            <span className="med-section-icon med-icon-purple">

              <Icon name="clipboard" size={23} />

            </span>

            <div>

              <span className="med-eyebrow">

                YOUR DOCUMENT LIBRARY

              </span>

              <h2>Prescription Transcriptions</h2>

              <p>

                Uploaded prescriptions and professional drafts

              </p>

            </div>

          </div>



          <span className="med-count med-count-purple">

            {loading

              ? "Loading..."

              : `${uploads.length} uploaded`}

          </span>

        </div>



        {loading ? (

          <div className="med-empty">

            Loading uploaded prescriptions...

          </div>

        ) : uploads.length === 0 ? (

          <div className="med-empty">

            <Icon name="file" size={30} />

            <strong>No uploaded prescriptions yet</strong>

            <p>Uploaded documents will appear here.</p>

          </div>

        ) : (

          <div className="med-record-list">

            {uploads.map((document) => (

              <PrescriptionRecord

                key={document.document_id}

                document={document}

                onDeleted={handleDeleted}

              />

            ))}

          </div>

        )}

      </section>



      <footer className="med-security-note">

        <div className="med-security-icon">

          <Icon name="shield" size={29} />

        </div>



        <div className="med-security-content">

          <div className="med-security-heading">

            <h3>Privacy & Prescription Safety</h3>

            <span>

              <Icon name="lock" size={13} />

              Protected access

            </span>

          </div>



          <p>

            Prescription documents contain private medical

            information. Automated transcription may contain

            recognition errors. A pharmacist must verify

            medication details against the original prescription

            before clinical use.

          </p>

        </div>

      </footer>

    </div>

  );

}



export default PrescriptionsPage;

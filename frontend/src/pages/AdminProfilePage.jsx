import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./AdminProfilePage.css";

import AdminLiveDateTime
  from "../components/AdminLiveDateTime";


function ProfileIcon({
  name,
  size = 22,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };


  const icons = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.7 2.8 8.3 7 10 4.2-1.7 7-5.3 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),

    role: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="m16 9 2 2 3-4" />
      </>
    ),

    building: (
      <>
        <path d="M5 21V4h10v17" />
        <path d="M15 9h4v12" />
        <path d="M8 8h4" />
        <path d="M8 12h4" />
        <path d="M8 16h4" />
      </>
    ),

    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    key: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="m11 12 8-8" />
        <path d="m16 7 2 2" />
        <path d="m14 9 2 2" />
      </>
    ),

    monitor: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </>
    ),

    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18h1.1a1.9 1.9 0 0 0 1.4-3.2 1.9 1.9 0 0 1 1.4-3.2H18a3 3 0 0 0 3-3A8.6 8.6 0 0 0 12 3Z" />
        <circle cx="7.5" cy="10" r=".75" />
        <circle cx="10" cy="7" r=".75" />
        <circle cx="14" cy="7.5" r=".75" />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    activity: (
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    ),

    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),

    chevron: (
      <path d="m9 18 6-6-6-6" />
    ),

    moon: (
      <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
    ),

    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </>
    ),

    device: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M9 18h6" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    patients: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M15 16a4 4 0 0 1 6 4" />
      </>
    ),

    inventory: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="M4 7v10l8 4 8-4V7" />
      </>
    ),

    prescription: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),

    report: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </>
    ),

    camera: (
      <>
        <path d="M5 7h3l1.5-2h5L16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </>
    ),

    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),

    x: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
  };


  return (
    <svg {...common}>
      {icons[name] || icons.user}
    </svg>
  );
}


function AdminProfilePage() {
  const fileInputRef =
    useRef(null);


  const adminName =
    localStorage.getItem(
      "user_name"
    ) ||
    "Dr. Evans Admin";


  const adminEmail =
    localStorage.getItem(
      "user_email"
    ) ||
    "Administrator account";


  const initials =
    adminName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase()
      )
      .join("") ||
    "DE";


  const [
    profilePhoto,
    setProfilePhoto,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_profile_photo"
      ) ||
      ""
  );


  const [
    pendingPhoto,
    setPendingPhoto,
  ] = useState("");


  const [
    photoMessage,
    setPhotoMessage,
  ] = useState("");


  const [
    theme,
    setTheme,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_theme"
      ) ||
      document.documentElement.getAttribute(
        "data-admin-theme"
      ) ||
      "light"
  );


  const [
    notificationPrefs,
    setNotificationPrefs,
  ] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          "admin_notification_preferences"
        );

      return saved
        ? JSON.parse(saved)
        : {
            lowStock: true,
            expiry: true,
            purchases: true,
            support: true,
          };
    } catch {
      return {
        lowStock: true,
        expiry: true,
        purchases: true,
        support: true,
      };
    }
  });


  const [
    message,
    setMessage,
  ] = useState("");


  useEffect(() => {
    document.documentElement.setAttribute(
      "data-admin-theme",
      theme
    );

    localStorage.setItem(
      "admin_theme",
      theme
    );
  }, [theme]);


  useEffect(() => {
    localStorage.setItem(
      "admin_notification_preferences",
      JSON.stringify(
        notificationPrefs
      )
    );
  }, [notificationPrefs]);


  const accessItems = [
    {
      icon: "patients",
      title:
        "Patient Management",
      description:
        "Review patient accounts, medicine requests and pharmacy service activity.",
    },

    {
      icon: "prescription",
      title:
        "Prescription & Refill Oversight",
      description:
        "Monitor prescriptions, refill requests and medicine fulfilment workflows.",
    },

    {
      icon: "inventory",
      title:
        "Medicine Inventory",
      description:
        "Monitor stock availability, pricing, reorder levels and medicine records.",
    },

    {
      icon: "report",
      title:
        "Reports & Operations",
      description:
        "Access pharmacy reports, operational records, alerts and administration tools.",
    },
  ];


  const securityItems =
    useMemo(
      () => [
        {
          icon: "key",
          accent: "blue",
          eyebrow:
            "Authentication",
          title:
            "Change Password",
          description:
            "Update the password used to secure your administrator account.",
          action:
            "Password Settings",
          onClick: () =>
            setMessage(
              "Password settings are ready for backend authentication integration."
            ),
        },

        {
          icon: "lock",
          accent: "violet",
          eyebrow:
            "Quick Security",
          title:
            "Lock Application",
          description:
            "Temporarily protect the pharmacy dashboard when stepping away.",
          action:
            "Lock Application",
          onClick: () =>
            setMessage(
              "Application lock is ready to connect to administrator verification."
            ),
        },

        {
          icon: "monitor",
          accent: "orange",
          eyebrow:
            "Sessions",
          title:
            "Active Sessions",
          description:
            "Review this administrator session and signed-in devices.",
          action:
            "View Sessions",
          onClick: () =>
            setMessage(
              "This browser is the current administrator session."
            ),
        },
      ],
      []
    );


  const visiblePhoto =
    pendingPhoto ||
    profilePhoto;


  function openPhotoPicker() {
    fileInputRef.current
      ?.click();
  }


  function handlePhotoSelect(
    event
  ) {
    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setPhotoMessage(
        "Please choose a JPG, PNG or WebP image."
      );

      event.target.value =
        "";

      return;
    }


    const maxSize =
      2 * 1024 * 1024;


    if (
      file.size >
      maxSize
    ) {
      setPhotoMessage(
        "Profile photo must be 2 MB or smaller."
      );

      event.target.value =
        "";

      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {
      const result =
        typeof reader.result ===
        "string"
          ? reader.result
          : "";


      setPendingPhoto(
        result
      );

      setPhotoMessage(
        "Preview ready. Save the photo to use it across the admin dashboard."
      );
    };


    reader.onerror = () => {
      setPhotoMessage(
        "The image could not be read. Please try another photo."
      );
    };


    reader.readAsDataURL(
      file
    );


    event.target.value =
      "";
  }


  function saveProfilePhoto() {
    if (!pendingPhoto) {
      return;
    }


    try {
      localStorage.setItem(
        "admin_profile_photo",
        pendingPhoto
      );


      setProfilePhoto(
        pendingPhoto
      );


      setPendingPhoto(
        ""
      );


      setPhotoMessage(
        "Profile photo saved successfully."
      );


      window.dispatchEvent(
        new CustomEvent(
          "admin-profile-photo-updated",
          {
            detail: {
              photo:
                pendingPhoto,
            },
          }
        )
      );
    } catch {
      setPhotoMessage(
        "This photo is too large for browser storage. Try a smaller image."
      );
    }
  }


  function cancelPhotoPreview() {
    setPendingPhoto(
      ""
    );

    setPhotoMessage(
      ""
    );
  }


  function removeProfilePhoto() {
    localStorage.removeItem(
      "admin_profile_photo"
    );


    setProfilePhoto(
      ""
    );


    setPendingPhoto(
      ""
    );


    setPhotoMessage(
      "Profile photo removed. Your initials are now being used."
    );


    window.dispatchEvent(
      new CustomEvent(
        "admin-profile-photo-updated",
        {
          detail: {
            photo: "",
          },
        }
      )
    );
  }


  function toggleNotification(
    key
  ) {
    setNotificationPrefs(
      (current) => ({
        ...current,
        [key]:
          !current[key],
      })
    );
  }


  function handleLogout() {
    window.dispatchEvent(
      new CustomEvent(
        "admin-request-logout"
      )
    );
  }


  return (
    <section className="admin-profile-page">

      {/* =====================================================
          PREMIUM HERO
      ===================================================== */}

      <header className="admin-profile-page__header">

        <div className="admin-profile-hero-main">

          <span className="admin-profile-hero-icon">

            {profilePhoto ? (
              <img
                src={
                  profilePhoto
                }
                alt=""
                className="admin-profile-hero-icon__photo"
              />
            ) : (
              <ProfileIcon
                name="user"
                size={30}
              />
            )}

          </span>


          <div className="admin-profile-page__heading">

            <span className="admin-profile-page__eyebrow">
              Administrator Account
            </span>


            <h1>
              My Profile
            </h1>


            <p>
              Manage your administrator identity, account security,
              display preferences and pharmacy access from one
              professional control centre.
            </p>

          </div>

        </div>


        <div className="admin-profile-hero-side">

          <span className="admin-profile-hero-badge">

            <ProfileIcon
              name="shield"
              size={15}
            />

            Secure Admin

          </span>


          <AdminLiveDateTime />

        </div>

      </header>


      {/* =====================================================
          PROFILE AREA
      ===================================================== */}

      <div className="admin-profile-page__top-grid">

        <article className="admin-profile-card">

          <div className="admin-profile-card__top-accent" />


          <div className="admin-profile-card__avatar-section">

            <div className="admin-profile-card__avatar-wrap">

              <div className={`admin-profile-card__avatar ${
                visiblePhoto
                  ? "has-photo"
                  : ""
              }`}>

                {visiblePhoto ? (
                  <img
                    src={
                      visiblePhoto
                    }
                    alt={`${adminName} profile`}
                  />
                ) : (
                  initials
                )}

              </div>


              <span className="admin-profile-card__verified">

                <ProfileIcon
                  name="shield"
                  size={16}
                />

              </span>

            </div>


            <button
              className="admin-profile-photo-camera"
              onClick={
                openPhotoPicker
              }
              type="button"
              aria-label="Change profile photo"
              title="Change profile photo"
            >

              <ProfileIcon
                name="camera"
                size={17}
              />

            </button>

          </div>


          <input
            ref={
              fileInputRef
            }
            className="admin-profile-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handlePhotoSelect
            }
          />


          <span className="admin-profile-card__eyebrow">
            Administrator Profile
          </span>


          <h2>
            {adminName}
          </h2>


          <p className="admin-profile-card__description">
            Dr. Evans Pharmacy Administration
          </p>


          <div className="admin-profile-card__status">

            <span className="admin-profile-card__status-dot" />

            <span>
              Active administrator account
            </span>

          </div>


          {/* =================================================
              PHOTO CONTROLS
          ================================================= */}

          <div className="admin-profile-photo-panel">

            <div className="admin-profile-photo-panel__copy">

              <strong>
                Profile Photo
              </strong>

              <span>
                JPG, PNG or WebP. Maximum 2 MB.
              </span>

            </div>


            {!pendingPhoto && (
              <div className="admin-profile-photo-actions">

                <button
                  className="admin-profile-photo-button admin-profile-photo-button--primary"
                  onClick={
                    openPhotoPicker
                  }
                  type="button"
                >

                  <ProfileIcon
                    name="upload"
                    size={16}
                  />

                  <span>
                    {profilePhoto
                      ? "Change Photo"
                      : "Add Photo"}
                  </span>

                </button>


                {profilePhoto && (
                  <button
                    className="admin-profile-photo-button admin-profile-photo-button--remove"
                    onClick={
                      removeProfilePhoto
                    }
                    type="button"
                  >

                    <ProfileIcon
                      name="trash"
                      size={16}
                    />

                    <span>
                      Remove
                    </span>

                  </button>
                )}

              </div>
            )}


            {pendingPhoto && (
              <div className="admin-profile-photo-actions admin-profile-photo-actions--preview">

                <button
                  className="admin-profile-photo-button admin-profile-photo-button--save"
                  onClick={
                    saveProfilePhoto
                  }
                  type="button"
                >

                  <ProfileIcon
                    name="check"
                    size={16}
                  />

                  <span>
                    Save Photo
                  </span>

                </button>


                <button
                  className="admin-profile-photo-button admin-profile-photo-button--cancel"
                  onClick={
                    cancelPhotoPreview
                  }
                  type="button"
                >

                  <ProfileIcon
                    name="x"
                    size={16}
                  />

                  <span>
                    Cancel
                  </span>

                </button>

              </div>
            )}


            {photoMessage && (
              <p className="admin-profile-photo-message">
                {photoMessage}
              </p>
            )}

          </div>

        </article>


        {/* =====================================================
            ADMINISTRATOR DETAILS
        ===================================================== */}

        <article className="admin-profile-details-card">

          <div className="admin-profile-section-header admin-profile-section-header--teal">

            <span className="admin-profile-section-icon">

              <ProfileIcon
                name="user"
                size={22}
              />

            </span>


            <div>

              <span className="admin-profile-section-eyebrow">
                Profile Information
              </span>

              <h2>
                Administrator Details
              </h2>

              <p>
                Personal and pharmacy identity attached to this account.
              </p>

            </div>

          </div>


          <div className="admin-profile-details-grid">

            <div className="admin-profile-detail">

              <span className="admin-profile-detail__icon">
                <ProfileIcon
                  name="user"
                  size={18}
                />
              </span>

              <div>
                <span>
                  Full Name
                </span>

                <strong>
                  {adminName}
                </strong>
              </div>

            </div>


            <div className="admin-profile-detail">

              <span className="admin-profile-detail__icon">
                <ProfileIcon
                  name="role"
                  size={18}
                />
              </span>

              <div>
                <span>
                  Account Role
                </span>

                <strong>
                  Administrator
                </strong>
              </div>

            </div>


            <div className="admin-profile-detail">

              <span className="admin-profile-detail__icon">
                <ProfileIcon
                  name="mail"
                  size={18}
                />
              </span>

              <div>
                <span>
                  Email Address
                </span>

                <strong>
                  {adminEmail}
                </strong>
              </div>

            </div>


            <div className="admin-profile-detail">

              <span className="admin-profile-detail__icon">
                <ProfileIcon
                  name="building"
                  size={18}
                />
              </span>

              <div>
                <span>
                  Pharmacy
                </span>

                <strong>
                  Dr. Evans Pharmacy
                </strong>
              </div>

            </div>

          </div>

        </article>

      </div>


      {/* =====================================================
          ACCOUNT & SECURITY
      ===================================================== */}

      <article className="admin-profile-control-card">

        <div className="admin-profile-section-header admin-profile-section-header--blue">

          <span className="admin-profile-section-icon">

            <ProfileIcon
              name="shield"
              size={22}
            />

          </span>


          <div>

            <span className="admin-profile-section-eyebrow">
              Account & Security
            </span>

            <h2>
              Security Controls
            </h2>

            <p>
              Protect administrator access and manage security-sensitive actions.
            </p>

          </div>


          <span className="admin-profile-section-badge">
            Protected
          </span>

        </div>


        <div className="admin-account-action-grid">

          {securityItems.map(
            (item) => (
              <button
                className={`admin-account-action admin-account-action--${item.accent}`}
                key={item.title}
                onClick={
                  item.onClick
                }
                type="button"
              >

                <span className="admin-account-action__icon">

                  <ProfileIcon
                    name={
                      item.icon
                    }
                    size={22}
                  />

                </span>


                <span className="admin-account-action__copy">

                  <small>
                    {item.eyebrow}
                  </small>

                  <strong>
                    {item.title}
                  </strong>

                  <span>
                    {item.description}
                  </span>

                </span>


                <span className="admin-account-action__footer">

                  <b>
                    {item.action}
                  </b>

                  <ProfileIcon
                    name="chevron"
                    size={17}
                  />

                </span>

              </button>
            )
          )}

        </div>

      </article>


      {/* =====================================================
          THEME
      ===================================================== */}

      <article className="admin-profile-control-card">

        <div className="admin-profile-section-header admin-profile-section-header--cyan">

          <span className="admin-profile-section-icon">

            <ProfileIcon
              name="palette"
              size={22}
            />

          </span>


          <div>

            <span className="admin-profile-section-eyebrow">
              Preferences
            </span>

            <h2>
              Theme & Display
            </h2>

            <p>
              Choose how the pharmacy administration interface appears.
            </p>

          </div>


          <span className="admin-profile-section-badge">
            {theme === "dark"
              ? "Dark Mode"
              : "Light Mode"}
          </span>

        </div>


        <div className="admin-profile-preference-body">

          <div className="admin-theme-choice-grid">

            <button
              className={`admin-theme-choice ${
                theme === "light"
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                setTheme("light")
              }
              type="button"
            >

              <span className="admin-theme-choice__icon">

                <ProfileIcon
                  name="sun"
                  size={22}
                />

              </span>


              <span>

                <strong>
                  Light Mode
                </strong>

                <small>
                  Bright professional workspace
                </small>

              </span>


              {theme === "light" && (
                <ProfileIcon
                  name="check"
                  size={18}
                />
              )}

            </button>


            <button
              className={`admin-theme-choice ${
                theme === "dark"
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                setTheme("dark")
              }
              type="button"
            >

              <span className="admin-theme-choice__icon">

                <ProfileIcon
                  name="moon"
                  size={22}
                />

              </span>


              <span>

                <strong>
                  Dark Mode
                </strong>

                <small>
                  Reduced-glare pharmacy dashboard
                </small>

              </span>


              {theme === "dark" && (
                <ProfileIcon
                  name="check"
                  size={18}
                />
              )}

            </button>

          </div>

        </div>

      </article>


      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <article className="admin-profile-control-card">

        <div className="admin-profile-section-header admin-profile-section-header--orange">

          <span className="admin-profile-section-icon">

            <ProfileIcon
              name="bell"
              size={22}
            />

          </span>


          <div>

            <span className="admin-profile-section-eyebrow">
              Notifications
            </span>

            <h2>
              Pharmacy Alerts
            </h2>

            <p>
              Control which operational events are highlighted to the administrator.
            </p>

          </div>


          <span className="admin-profile-section-badge">
            Preferences
          </span>

        </div>


        <div className="admin-notification-grid">

          {[
            {
              key:
                "lowStock",
              title:
                "Low Stock Alerts",
              description:
                "Notify when medicine quantities reach reorder levels.",
            },

            {
              key:
                "expiry",
              title:
                "Expiry Alerts",
              description:
                "Highlight medicines approaching their expiry date.",
            },

            {
              key:
                "purchases",
              title:
                "Purchase Activity",
              description:
                "Surface important supplier and purchase record changes.",
            },

            {
              key:
                "support",
              title:
                "Support Tickets",
              description:
                "Notify about technical support updates and responses.",
            },
          ].map(
            (item) => (
              <label
                className="admin-notification-option"
                key={
                  item.key
                }
              >

                <span className="admin-notification-option__copy">

                  <strong>
                    {item.title}
                  </strong>

                  <small>
                    {item.description}
                  </small>

                </span>


                <input
                  checked={
                    notificationPrefs[
                      item.key
                    ]
                  }
                  onChange={() =>
                    toggleNotification(
                      item.key
                    )
                  }
                  type="checkbox"
                />

                <span className="admin-profile-switch" />

              </label>
            )
          )}

        </div>

      </article>


      {/* =====================================================
          ACTIVE SESSION
      ===================================================== */}

      <article className="admin-profile-control-card">

        <div className="admin-profile-section-header admin-profile-section-header--violet">

          <span className="admin-profile-section-icon">

            <ProfileIcon
              name="device"
              size={22}
            />

          </span>


          <div>

            <span className="admin-profile-section-eyebrow">
              Active Sessions
            </span>

            <h2>
              Signed-in Devices
            </h2>

            <p>
              Review where this administrator account is currently being used.
            </p>

          </div>


          <span className="admin-profile-section-badge">
            Current
          </span>

        </div>


        <div className="admin-session-list">

          <div className="admin-session-item">

            <span className="admin-session-item__icon">

              <ProfileIcon
                name="monitor"
                size={22}
              />

            </span>


            <div className="admin-session-item__copy">

              <strong>
                Current Browser Session
              </strong>

              <span>
                Dr. Evans Pharmacy Admin Dashboard
              </span>

              <small>
                Active now
              </small>

            </div>


            <span className="admin-session-current">
              Current Session
            </span>

          </div>

        </div>

      </article>


      {/* =====================================================
          ACTIVITY
      ===================================================== */}

      <article className="admin-profile-control-card">

        <div className="admin-profile-section-header admin-profile-section-header--green">

          <span className="admin-profile-section-icon">

            <ProfileIcon
              name="activity"
              size={22}
            />

          </span>


          <div>

            <span className="admin-profile-section-eyebrow">
              Account Activity
            </span>

            <h2>
              Security & Preference Activity
            </h2>

            <p>
              Recent account activity available from this browser session.
            </p>

          </div>

        </div>


        <div className="admin-profile-activity-list">

          <div className="admin-profile-activity-item">

            <span className="admin-profile-activity-icon">

              <ProfileIcon
                name="shield"
                size={19}
              />

            </span>


            <div>

              <strong>
                Administrator session active
              </strong>

              <span>
                This account is currently authenticated in the dashboard.
              </span>

            </div>

          </div>


          <div className="admin-profile-activity-item">

            <span className="admin-profile-activity-icon">

              <ProfileIcon
                name="palette"
                size={19}
              />

            </span>


            <div>

              <strong>
                Display preference
              </strong>

              <span>
                Current interface theme:{" "}
                {theme === "dark"
                  ? "Dark mode"
                  : "Light mode"}.
              </span>

            </div>

          </div>

        </div>

      </article>


      {/* =====================================================
          ACCESS
      ===================================================== */}

      <article className="admin-profile-access-card">

        <div className="admin-profile-section-header admin-profile-section-header--blue">

          <span className="admin-profile-section-icon">

            <ProfileIcon
              name="shield"
              size={22}
            />

          </span>


          <div>

            <span className="admin-profile-section-eyebrow">
              Administration
            </span>

            <h2>
              Account Access
            </h2>

            <p>
              Pharmacy management areas available to this administrator.
            </p>

          </div>


          <span className="admin-profile-access-badge">

            <ProfileIcon
              name="lock"
              size={14}
            />

            Protected Access

          </span>

        </div>


        <div className="admin-profile-access-grid">

          {accessItems.map(
            (item) => (
              <div
                className="admin-profile-access-item"
                key={
                  item.title
                }
              >

                <span className="admin-profile-access-item__icon">

                  <ProfileIcon
                    name={
                      item.icon
                    }
                    size={21}
                  />

                </span>


                <div>

                  <strong>
                    {item.title}
                  </strong>

                  <p>
                    {item.description}
                  </p>

                </div>

              </div>
            )
          )}

        </div>

      </article>


      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div className="admin-profile-inline-message">

          <span>
            {message}
          </span>

          <button
            onClick={() =>
              setMessage("")
            }
            type="button"
          >
            ×
          </button>

        </div>
      )}


      {/* =====================================================
          LOGOUT
      ===================================================== */}

      <article className="admin-profile-danger-card">

        <div className="admin-profile-danger-copy">

          <span className="admin-profile-danger-icon">

            <ProfileIcon
              name="shield"
              size={22}
            />

          </span>


          <div>

            <span className="admin-profile-danger-eyebrow">
              Account Session
            </span>

            <h2>
              Secure Administrator Access
            </h2>

            <p>
              Always sign out after using a shared pharmacy workstation.
            </p>

          </div>

        </div>


        <button
          className="admin-profile-logout-button"
          onClick={
            handleLogout
          }
          type="button"
        >

          <ProfileIcon
            name="logout"
            size={19}
          />

          <span>
            Log Out
          </span>

        </button>

      </article>

    </section>
  );
}


export default AdminProfilePage;
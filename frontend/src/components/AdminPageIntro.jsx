import AdminLiveDateTime from "./AdminLiveDateTime";

import "./AdminPageIntro.css";

function AdminPageIntro({
  eyebrow,
  title,
  subtitle,
  accent = "teal",
}) {
  return (
    <section
      className={`admin-page-intro admin-page-intro--${accent}`}
    >
      <div className="admin-page-intro__decor admin-page-intro__decor--one" />
      <div className="admin-page-intro__decor admin-page-intro__decor--two" />

      <div className="admin-page-intro__content">
        <div className="admin-page-intro__copy">
          <span className="admin-page-intro__eyebrow">
            {eyebrow}
          </span>

          <h1 className="admin-page-intro__title">
            {title}
          </h1>

          <p className="admin-page-intro__subtitle">
            {subtitle}
          </p>
        </div>

        <div className="admin-page-intro__time">
          <AdminLiveDateTime />
        </div>
      </div>
    </section>
  );
}

export default AdminPageIntro;
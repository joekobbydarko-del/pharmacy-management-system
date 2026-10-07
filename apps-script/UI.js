/**
 * DR. EVANS PHARMACY
 * COMPLETE RESPONSIVE WEB APP USER INTERFACE
 *
 * DESKTOP:
 * - Wide professional card layout
 * - Multi-column payment/contact sections
 * - Desktop invoice table
 *
 * MOBILE:
 * - Full-screen app-style experience
 * - Single-column sections
 * - Large touch buttons
 * - Compact pharmacy header
 * - Mobile-friendly invoice layout
 */


/********************************************************
 * PHARMACY BRAND MARK
 ********************************************************/

function pharmacyLogoHtml_() {

  return `
    <div class="brand-icon">
      +
    </div>
  `;
}


/********************************************************
 * SHARED RESPONSIVE PAGE SHELL
 ********************************************************/

function pageShell_(
  title,
  subtitle,
  content
) {

  const html = `
  <!DOCTYPE html>

  <html>

  <head>

    <base target="_top">

    <meta
      name="viewport"
      content="
        width=device-width,
        initial-scale=1,
        maximum-scale=1,
        viewport-fit=cover
      "
    >

    <meta
      name="theme-color"
      content="#075563"
    >

    <title>
      ${escapeHtml_(title)}
    </title>


    <style>

      /**************************************************
       * RESET
       **************************************************/

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100%;
      }

      html {
        -webkit-text-size-adjust: 100%;
      }

      body {
        font-family:
          Arial,
          Helvetica,
          sans-serif;

        background:
          #edf3f4;

        color:
          #1f2937;

        overflow-x:
          hidden;
      }

      a,
      button,
      input {
        font-family: inherit;
      }


      /**************************************************
       * PAGE
       **************************************************/

      .page {
        width: 100%;
        min-height: 100vh;

        padding:
          36px 20px;
      }


      /**************************************************
       * MAIN SHELL - DESKTOP
       **************************************************/

      .shell {
        width: 100%;

        max-width:
          1080px;

        margin:
          0 auto;

        background:
          #ffffff;

        border:
          1px solid
          #dfe9eb;

        border-radius:
          26px;

        overflow:
          hidden;

        box-shadow:
          0 20px 55px
          rgba(
            15,
            23,
            42,
            .11
          );
      }


      /**************************************************
       * HEADER
       **************************************************/

      .header {
        padding:
          44px 48px;

        color:
          #ffffff;

        background:
          linear-gradient(
            135deg,
            #054b59 0%,
            #086372 55%,
            #0f766e 100%
          );
      }


      .brand {
        display:
          flex;

        align-items:
          center;

        gap:
          16px;

        margin-bottom:
          34px;
      }


      .brand-icon {
        width:
          58px;

        height:
          58px;

        flex:
          0 0 58px;

        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        border-radius:
          17px;

        background:
          linear-gradient(
            135deg,
            #2dd4bf,
            #0d9488
          );

        color:
          #ffffff;

        font-size:
          39px;

        line-height:
          1;

        font-weight:
          700;

        box-shadow:
          0 8px 18px
          rgba(
            0,
            0,
            0,
            .15
          );
      }


      .brand-name {
        font-size:
          29px;

        font-weight:
          800;

        line-height:
          1.1;
      }


      .brand-subtitle {
        margin-top:
          5px;

        color:
          #d4ecee;

        font-size:
          12px;

        letter-spacing:
          1.3px;

        text-transform:
          uppercase;
      }


      .page-title {
        margin:
          0;

        max-width:
          760px;

        font-size:
          46px;

        line-height:
          1.08;

        letter-spacing:
          -.7px;
      }


      .page-subtitle {
        max-width:
          760px;

        margin:
          13px 0 0;

        color:
          #dbedef;

        font-size:
          17px;

        line-height:
          1.6;
      }


      /**************************************************
       * CONTENT
       **************************************************/

      .content {
        padding:
          46px;
      }


      /**************************************************
       * CARD
       **************************************************/

      .card {
        padding:
          30px;

        border:
          1px solid
          #dbe6e8;

        border-radius:
          18px;

        background:
          #fbfdfd;
      }


      /**************************************************
       * STATUS BADGES
       **************************************************/

      .success-badge,
      .pending-badge,
      .failed-badge {
        display:
          inline-flex;

        align-items:
          center;

        gap:
          6px;

        padding:
          9px 15px;

        border-radius:
          999px;

        font-size:
          12px;

        font-weight:
          800;

        letter-spacing:
          .3px;
      }


      .success-badge {
        background:
          #dcfce7;

        color:
          #166534;
      }


      .pending-badge {
        background:
          #fef3c7;

        color:
          #92400e;
      }


      .failed-badge {
        background:
          #fee2e2;

        color:
          #991b1b;
      }


      /**************************************************
       * NORMAL TEXT
       **************************************************/

      .text {
        margin-top:
          22px;

        color:
          #64748b;

        font-size:
          16px;

        line-height:
          1.75;
      }


      .text strong {
        color:
          #0f172a;
      }


      /**************************************************
       * SUMMARY
       **************************************************/

      .summary {
        margin-top:
          25px;

        padding:
          20px;

        border:
          1px solid
          #dbe7e9;

        border-radius:
          14px;

        background:
          #f1f7f7;
      }


      .summary-row {
        display:
          flex;

        justify-content:
          space-between;

        align-items:
          flex-start;

        gap:
          24px;

        padding:
          10px 0;

        border-bottom:
          1px solid
          #dfe9eb;
      }


      .summary-row:last-child {
        border-bottom:
          none;
      }


      .summary-label {
        color:
          #64748b;

        font-size:
          14px;

        font-weight:
          600;
      }


      .summary-value {
        max-width:
          60%;

        color:
          #0f172a;

        font-size:
          14px;

        font-weight:
          700;

        text-align:
          right;

        overflow-wrap:
          anywhere;
      }


      /**************************************************
       * AMOUNT BOX
       **************************************************/

      .amount-box {
        margin-top:
          25px;

        padding:
          27px;

        border-radius:
          17px;

        background:
          linear-gradient(
            135deg,
            #073b4c,
            #075563
          );

        color:
          #ffffff;

        text-align:
          center;
      }


      .amount-label {
        color:
          #cde6e8;

        font-size:
          12px;

        font-weight:
          700;

        text-transform:
          uppercase;

        letter-spacing:
          1.2px;
      }


      .amount-value {
        margin-top:
          8px;

        font-size:
          40px;

        font-weight:
          800;

        line-height:
          1.1;
      }


      /**************************************************
       * SECTION TITLES
       **************************************************/

      .section-title,
      .payment-title {
        margin:
          35px 0 9px;

        color:
          #0f172a;

        font-size:
          23px;

        line-height:
          1.25;
      }


      .payment-description {
        margin:
          0 0 21px;

        color:
          #64748b;

        font-size:
          14px;

        line-height:
          1.7;
      }


      /**************************************************
       * TWO-COLUMN DESKTOP GRIDS
       **************************************************/

      .payment-grid,
      .contact-grid {
        display:
          grid;

        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );

        gap:
          20px;

        align-items:
          stretch;
      }


      .payment-card,
      .contact-card {
        display:
          flex;

        flex-direction:
          column;

        padding:
          25px;

        border:
          2px solid
          #dbe7e9;

        border-radius:
          17px;

        background:
          #ffffff;

        transition:
          transform .18s ease,
          border-color .18s ease,
          box-shadow .18s ease;
      }


      .payment-card:hover,
      .contact-card:hover {
        transform:
          translateY(-4px);

        border-color:
          #0f766e;

        box-shadow:
          0 12px 28px
          rgba(
            15,
            118,
            110,
            .13
          );
      }


      /**************************************************
       * ICONS
       **************************************************/

      .payment-icon,
      .contact-icon {
        width:
          54px;

        height:
          54px;

        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        margin-bottom:
          17px;

        border-radius:
          15px;

        background:
          #e8f5f3;

        color:
          #0f766e;

        font-size:
          24px;

        font-weight:
          800;
      }


      .whatsapp-icon {
        background:
          #dcfce7;

        color:
          #15803d;
      }


      .sms-icon {
        background:
          #e0f2fe;

        color:
          #0369a1;
      }


      .bank-icon {
        background:
          #fef3c7;

        color:
          #92400e;
      }


      /**************************************************
       * PAYMENT / CONTACT CARD TEXT
       **************************************************/

      .payment-name,
      .contact-name {
        color:
          #0f172a;

        font-size:
          20px;

        font-weight:
          800;

        line-height:
          1.3;
      }


      .payment-info,
      .contact-info {
        flex:
          1;

        margin-top:
          10px;

        color:
          #64748b;

        font-size:
          14px;

        line-height:
          1.7;
      }


      .detail-line {
        margin-top:
          9px;

        overflow-wrap:
          anywhere;
      }


      .detail-line strong {
        color:
          #334155;
      }


      /**************************************************
       * BANK DETAILS
       **************************************************/

      .bank-details {
        margin-top:
          18px;

        padding:
          16px;

        border:
          1px solid
          #e2e8f0;

        border-radius:
          12px;

        background:
          #f8fafc;
      }


      /**************************************************
       * FORM
       **************************************************/

      .form-group {
        margin-top:
          20px;
      }


      .form-label {
        display:
          block;

        margin-bottom:
          8px;

        color:
          #334155;

        font-size:
          13px;

        font-weight:
          700;
      }


      .form-input {
        width:
          100%;

        min-height:
          48px;

        padding:
          13px 14px;

        border:
          1px solid
          #cbd5e1;

        border-radius:
          10px;

        background:
          #ffffff;

        color:
          #0f172a;

        font-size:
          16px;

        outline:
          none;
      }


      .form-input:focus {
        border-color:
          #0f766e;

        box-shadow:
          0 0 0 3px
          rgba(
            15,
            118,
            110,
            .11
          );
      }


      .form-help {
        margin-top:
          7px;

        color:
          #94a3b8;

        font-size:
          11px;

        line-height:
          1.5;
      }


      /**************************************************
       * INVOICE
       **************************************************/

      .invoice-top {
        display:
          grid;

        grid-template-columns:
          1fr 1fr;

        gap:
          18px;

        margin-top:
          25px;
      }


      .invoice-box {
        padding:
          20px;

        border:
          1px solid
          #dbe7e9;

        border-radius:
          14px;

        background:
          #ffffff;
      }


      .invoice-box-title {
        margin-bottom:
          13px;

        color:
          #075563;

        font-size:
          12px;

        font-weight:
          800;

        text-transform:
          uppercase;

        letter-spacing:
          .5px;
      }


      .invoice-line {
        margin-top:
          8px;

        color:
          #475569;

        font-size:
          14px;

        line-height:
          1.6;

        overflow-wrap:
          anywhere;
      }


      .invoice-line strong {
        color:
          #0f172a;
      }


      /**************************************************
       * INVOICE TABLE - DESKTOP
       **************************************************/

      .invoice-table-wrap {
        margin-top:
          24px;

        border:
          1px solid
          #dbe7e9;

        border-radius:
          14px;

        overflow:
          hidden;

        background:
          #ffffff;
      }


      .invoice-table {
        width:
          100%;

        border-collapse:
          collapse;
      }


      .invoice-table th {
        padding:
          15px;

        background:
          #075563;

        color:
          #ffffff;

        text-align:
          left;

        font-size:
          13px;

        font-weight:
          700;
      }


      .invoice-table td {
        padding:
          15px;

        border-bottom:
          1px solid
          #e2e8f0;

        color:
          #475569;

        font-size:
          14px;
      }


      .invoice-table tr:last-child td {
        border-bottom:
          none;
      }


      /**************************************************
       * INVOICE TOTAL
       **************************************************/

      .invoice-total {
        margin-top:
          24px;

        padding:
          21px;

        border-radius:
          14px;

        background:
          linear-gradient(
            135deg,
            #073b4c,
            #075563
          );

        color:
          #ffffff;
      }


      .invoice-total-row {
        display:
          flex;

        justify-content:
          space-between;

        gap:
          20px;

        padding:
          7px 0;

        font-size:
          14px;
      }


      .invoice-total-row.final {
        margin-top:
          8px;

        padding-top:
          15px;

        border-top:
          1px solid
          rgba(
            255,
            255,
            255,
            .22
          );

        font-size:
          20px;

        font-weight:
          800;
      }


      /**************************************************
       * NOTICES
       **************************************************/

      .notice,
      .success-notice,
      .error-notice {
        margin-top:
          24px;

        padding:
          17px 18px;

        border-radius:
          12px;

        font-size:
          13px;

        line-height:
          1.65;
      }


      .notice {
        border:
          1px solid
          #fde68a;

        background:
          #fffbeb;

        color:
          #92400e;
      }


      .success-notice {
        border:
          1px solid
          #bbf7d0;

        background:
          #f0fdf4;

        color:
          #166534;
      }


      .error-notice {
        border:
          1px solid
          #fecaca;

        background:
          #fef2f2;

        color:
          #991b1b;
      }


      /**************************************************
       * BUTTON AREAS
       **************************************************/

      .actions {
        display:
          grid;

        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );

        gap:
          14px;

        margin-top:
          28px;
      }


      .single-action {
        margin-top:
          20px;
      }


      .button {
        display:
          flex;

        width:
          100%;

        min-height:
          50px;

        align-items:
          center;

        justify-content:
          center;

        padding:
          14px 20px;

        border:
          none;

        border-radius:
          11px;

        text-align:
          center;

        text-decoration:
          none;

        font-size:
          14px;

        font-weight:
          700;

        line-height:
          1.25;

        cursor:
          pointer;

        transition:
          transform .16s ease,
          box-shadow .16s ease,
          opacity .16s ease;
      }


      .button:hover {
        transform:
          translateY(-2px);

        opacity:
          .97;
      }


      .button:active {
        transform:
          translateY(0);
      }


      .button-primary {
        background:
          #0f766e;

        color:
          #ffffff;
      }


      .button-primary:hover {
        box-shadow:
          0 8px 18px
          rgba(
            15,
            118,
            110,
            .22
          );
      }


      .button-bank {
        background:
          #073b4c;

        color:
          #ffffff;
      }


      .button-whatsapp {
        background:
          #16a34a;

        color:
          #ffffff;
      }


      .button-sms {
        background:
          #0369a1;

        color:
          #ffffff;
      }


      .button-secondary {
        border:
          1px solid
          #cfe2e4;

        background:
          #e7f2f3;

        color:
          #075563;
      }


      /**************************************************
       * PAYMENT SUCCESS DOWNLOAD ACTIONS
       **************************************************/

      .payment-actions {
        display:
          grid;

        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );

        gap:
          15px;

        margin-top:
          26px;
      }


      .success-download-btn {
        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        min-height:
          50px;

        padding:
          14px 20px;

        border-radius:
          11px;

        text-align:
          center;

        text-decoration:
          none;

        font-size:
          14px;

        font-weight:
          700;

        transition:
          transform .18s ease,
          box-shadow .18s ease;
      }


      .success-download-btn:hover {
        transform:
          translateY(-2px);
      }


      .invoice-download-btn {
        background:
          #0f766e;

        color:
          #ffffff !important;
      }


      .receipt-download-btn {
        background:
          #075563;

        color:
          #ffffff !important;
      }


      /**************************************************
       * FOOTER
       **************************************************/

      .footer {
        padding:
          25px;

        border-top:
          1px solid
          #e6eef0;

        background:
          #f8fafc;

        color:
          #94a3b8;

        text-align:
          center;

        font-size:
          11px;

        line-height:
          1.7;
      }


      /**************************************************
       *
       * TABLET
       *
       **************************************************/

      @media (
        max-width: 800px
      ) {

        .page {
          padding:
            22px 14px;
        }


        .header {
          padding:
            36px 32px;
        }


        .content {
          padding:
            32px;
        }


        .page-title {
          font-size:
            38px;
        }


        .payment-grid,
        .contact-grid {
          gap:
            14px;
        }

      }


      /**************************************************
       *
       * MOBILE PHONE LAYOUT
       *
       * This intentionally looks different
       * from desktop.
       *
       **************************************************/

      @media (
        max-width: 620px
      ) {

        body {
          background:
            #ffffff;
        }


        /**********************************************
         * FULL SCREEN MOBILE APP
         **********************************************/

        .page {
          min-height:
            100vh;

          padding:
            0;
        }


        .shell {
          min-height:
            100vh;

          border:
            none;

          border-radius:
            0;

          box-shadow:
            none;
        }


        /**********************************************
         * MOBILE HEADER
         **********************************************/

        .header {
          padding:
            22px 18px 26px;

          border-radius:
            0 0 24px 24px;

          background:
            linear-gradient(
              145deg,
              #054b59,
              #075563 55%,
              #0f766e
            );
        }


        .brand {
          gap:
            11px;

          margin-bottom:
            24px;
        }


        .brand-icon {
          width:
            43px;

          height:
            43px;

          flex:
            0 0 43px;

          border-radius:
            12px;

          font-size:
            28px;
        }


        .brand-name {
          font-size:
            19px;

          line-height:
            1.15;
        }


        .brand-subtitle {
          margin-top:
            3px;

          font-size:
            8px;

          letter-spacing:
            .8px;
        }


        .page-title {
          font-size:
            29px;

          line-height:
            1.12;

          letter-spacing:
            -.3px;
        }


        .page-subtitle {
          margin-top:
            9px;

          font-size:
            14px;

          line-height:
            1.55;
        }


        /**********************************************
         * MOBILE CONTENT
         **********************************************/

        .content {
          padding:
            18px 14px 28px;
        }


        .card {
          padding:
            19px 16px;

          border-radius:
            15px;

          background:
            #ffffff;

          box-shadow:
            0 5px 18px
            rgba(
              15,
              23,
              42,
              .05
            );
        }


        /**********************************************
         * MOBILE BADGES
         **********************************************/

        .success-badge,
        .pending-badge,
        .failed-badge {
          padding:
            8px 11px;

          font-size:
            10px;
        }


        /**********************************************
         * MOBILE TEXT
         **********************************************/

        .text {
          margin-top:
            17px;

          font-size:
            15px;

          line-height:
            1.65;
        }


        /**********************************************
         * MOBILE SUMMARY
         **********************************************/

        .summary {
          margin-top:
            20px;

          padding:
            8px 14px;

          border-radius:
            13px;
        }


        .summary-row {
          display:
            block;

          padding:
            12px 0;

          gap:
            0;
        }


        .summary-label {
          font-size:
            11px;

          text-transform:
            uppercase;

          letter-spacing:
            .45px;
        }


        .summary-value {
          max-width:
            none;

          margin-top:
            4px;

          font-size:
            15px;

          text-align:
            left;

          line-height:
            1.45;
        }


        /**********************************************
         * MOBILE AMOUNT
         **********************************************/

        .amount-box {
          margin-top:
            20px;

          padding:
            20px 14px;

          border-radius:
            14px;
        }


        .amount-label {
          font-size:
            10px;
        }


        .amount-value {
          font-size:
            32px;
        }


        /**********************************************
         * MOBILE HEADINGS
         **********************************************/

        .section-title,
        .payment-title {
          margin:
            27px 0 8px;

          font-size:
            20px;
        }


        .payment-description {
          font-size:
            13px;

          line-height:
            1.6;
        }


        /**********************************************
         * STACK EVERYTHING
         **********************************************/

        .payment-grid,
        .contact-grid,
        .invoice-top,
        .actions,
        .payment-actions {
          grid-template-columns:
            1fr;

          gap:
            14px;
        }


        /**********************************************
         * MOBILE PAYMENT / CONTACT CARDS
         **********************************************/

        .payment-card,
        .contact-card {
          padding:
            19px;

          border-width:
            1px;

          border-radius:
            14px;
        }


        .payment-card:hover,
        .contact-card:hover {
          transform:
            none;

          box-shadow:
            none;
        }


        .payment-icon,
        .contact-icon {
          width:
            45px;

          height:
            45px;

          margin-bottom:
            13px;

          border-radius:
            12px;

          font-size:
            20px;
        }


        .payment-name,
        .contact-name {
          font-size:
            18px;
        }


        .payment-info,
        .contact-info {
          font-size:
            13px;

          line-height:
            1.65;
        }


        /**********************************************
         * MOBILE BANK DETAILS
         **********************************************/

        .bank-details {
          padding:
            14px;

          font-size:
            13px;
        }


        /**********************************************
         * MOBILE FORM
         **********************************************/

        .form-input {
          min-height:
            52px;

          padding:
            14px;

          font-size:
            16px;
        }


        /**********************************************
         * MOBILE BUTTONS
         **********************************************/

        .button,
        .success-download-btn {
          min-height:
            54px;

          padding:
            15px 16px;

          border-radius:
            12px;

          font-size:
            15px;
        }


        .button:hover,
        .success-download-btn:hover {
          transform:
            none;
        }


        /**********************************************
         * MOBILE INVOICE BOX
         **********************************************/

        .invoice-top {
          margin-top:
            20px;
        }


        .invoice-box {
          padding:
            16px;

          border-radius:
            12px;
        }


        .invoice-box-title {
          font-size:
            11px;
        }


        .invoice-line {
          font-size:
            13px;
        }


        /**********************************************
         * MOBILE INVOICE TABLE
         *
         * Converts each row into a card.
         * No sideways scrolling.
         **********************************************/

        .invoice-table-wrap {
          border:
            none;

          border-radius:
            0;

          background:
            transparent;

          overflow:
            visible;
        }


        .invoice-table,
        .invoice-table thead,
        .invoice-table tbody,
        .invoice-table tr,
        .invoice-table th,
        .invoice-table td {
          display:
            block;

          width:
            100%;
        }


        .invoice-table thead {
          display:
            none;
        }


        .invoice-table {
          background:
            transparent;
        }


        .invoice-table tr {
          margin-bottom:
            12px;

          padding:
            13px 14px;

          border:
            1px solid
            #dbe7e9;

          border-radius:
            12px;

          background:
            #ffffff;
        }


        .invoice-table td {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            14px;

          padding:
            8px 0;

          border:
            none;

          font-size:
            13px;

          text-align:
            right;
        }


        .invoice-table td::before {
          flex:
            0 0 42%;

          color:
            #64748b;

          font-size:
            11px;

          font-weight:
            700;

          text-align:
            left;

          text-transform:
            uppercase;

          letter-spacing:
            .35px;
        }


        .invoice-table td:nth-child(1)::before {
          content:
            "Medication";
        }


        .invoice-table td:nth-child(2)::before {
          content:
            "Quantity";
        }


        .invoice-table td:nth-child(3)::before {
          content:
            "Unit Price";
        }


        .invoice-table td:nth-child(4)::before {
          content:
            "Total";
        }


        /**********************************************
         * MOBILE INVOICE TOTAL
         **********************************************/

        .invoice-total {
          margin-top:
            18px;

          padding:
            17px;

          border-radius:
            13px;
        }


        .invoice-total-row {
          font-size:
            13px;
        }


        .invoice-total-row.final {
          font-size:
            17px;
        }


        /**********************************************
         * MOBILE NOTICES
         **********************************************/

        .notice,
        .success-notice,
        .error-notice {
          margin-top:
            18px;

          padding:
            14px;

          border-radius:
            11px;

          font-size:
            12px;
        }


        /**********************************************
         * MOBILE FOOTER
         **********************************************/

        .footer {
          padding:
            20px 16px 26px;

          font-size:
            10px;
        }

      }


      /**************************************************
       * VERY SMALL PHONES
       **************************************************/

      @media (
        max-width: 380px
      ) {

        .header {
          padding:
            19px 15px 23px;
        }


        .content {
          padding:
            15px 11px 25px;
        }


        .card {
          padding:
            17px 13px;
        }


        .page-title {
          font-size:
            26px;
        }


        .brand-name {
          font-size:
            17px;
        }


        .amount-value {
          font-size:
            29px;
        }

      }


    </style>

  </head>


  <body>

    <div class="page">

      <main class="shell">

        <header class="header">

          <div class="brand">

            ${pharmacyLogoHtml_()}

            <div>

              <div class="brand-name">
                Dr. Evans Pharmacy
              </div>

              <div class="brand-subtitle">
                Pharmaceutical Patient Care
              </div>

            </div>

          </div>


          <h1 class="page-title">
            ${escapeHtml_(title)}
          </h1>


          <p class="page-subtitle">
            ${escapeHtml_(subtitle)}
          </p>

        </header>


        <section class="content">

          ${content}

        </section>


        <footer class="footer">

          Dr. Evans Pharmacy —
          Always making life better.

          <br>

          Thanks for choosing
          Dr. Evans Pharmacy.

        </footer>

      </main>

    </div>

  </body>

  </html>
  `;


  return HtmlService
    .createHtmlOutput(
      html
    )
    .setTitle(
      CONFIG.APP_NAME ||
      "Dr. Evans Pharmacy"
    );
}


/********************************************************
 * SYSTEM ONLINE PAGE
 ********************************************************/

function systemOnlinePage_() {

  return pageShell_(

    "System Online",

    "Dr. Evans Pharmacy system is running successfully.",

    `

    <div class="card">

      <span class="success-badge">
        ✓ SYSTEM READY
      </span>


      <div class="text">

        The pharmacy automation
        web application is active.

      </div>

    </div>

    `

  );
}


/********************************************************
 * CONTACT PATIENT PAGE
 ********************************************************/

function contactPatientPage_(
  data
) {

  const content = `

    <div class="card">

      <span class="success-badge">
        SECURE PATIENT CONTACT
      </span>


      <div class="text">

        Choose how you would like
        to contact

        <strong>
          ${escapeHtml_(data.patientName)}
        </strong>.

      </div>


      <div class="summary">

        <div class="summary-row">

          <div class="summary-label">
            Patient
          </div>

          <div class="summary-value">
            ${escapeHtml_(data.patientName)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Patient ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(data.patientId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Phone
          </div>

          <div class="summary-value">
            ${escapeHtml_(data.phone)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Preferred Contact
          </div>

          <div class="summary-value">
            ${escapeHtml_(data.preferredContact)}
          </div>

        </div>

      </div>


      <h2 class="section-title">
        Contact Method
      </h2>


      <p class="payment-description">

        Choose WhatsApp or SMS.

        Automated voice calls are handled
        separately by the pharmacy system.

      </p>


      <div class="contact-grid">


        <div class="contact-card">

          <div class="
            contact-icon
            whatsapp-icon
          ">
            W
          </div>


          <div class="contact-name">
            WhatsApp
          </div>


          <div class="contact-info">

            Open a WhatsApp conversation
            with the patient.

            <br><br>

            A privacy-safe refill message
            will already be prepared.

          </div>


          <div class="single-action">

            <a
              class="
                button
                button-whatsapp
              "
              href="${escapeHtml_(data.whatsappUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open WhatsApp
            </a>

          </div>

        </div>


        <div class="contact-card">

          <div class="
            contact-icon
            sms-icon
          ">
            S
          </div>


          <div class="contact-name">
            SMS
          </div>


          <div class="contact-info">

            Open the device messaging
            application with the prepared
            pharmacy refill message.

          </div>


          <div class="single-action">

            <a
              class="
                button
                button-sms
              "
              href="${escapeHtml_(data.smsUrl)}"
            >
              Open SMS
            </a>

          </div>

        </div>

      </div>


      <div class="notice">

        Patient contact messages should
        remain privacy-safe.

        Do not include unnecessary
        medical information in SMS
        or WhatsApp messages.

      </div>

    </div>
  `;


  return pageShell_(

    "Patient Contact Centre",

    "Secure patient communication",

    content

  );
}


/********************************************************
 * REFILL CONFIRMED PAGE
 ********************************************************/

function refillConfirmedPage_(
  result
) {

  const amount =
    Number(
      result.invoiceAmount || 0
    ).toFixed(
      2
    );


  const content = `

    <div class="card">

      <span class="success-badge">
        ✓ REFILL CONFIRMED
      </span>


      <div class="text">

        Thank you,

        <strong>
          ${escapeHtml_(result.patientName)}
        </strong>.

        Your refill request has been
        confirmed successfully.

      </div>


      <div class="summary">

        <div class="summary-row">

          <div class="summary-label">
            Refill ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.refillId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Order ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.orderId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Invoice ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.invoiceId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Amount
          </div>

          <div class="summary-value">
            GHS ${escapeHtml_(amount)}
          </div>

        </div>

      </div>


      <div class="actions">

        <a
          class="
            button
            button-secondary
          "
          href="${escapeHtml_(result.invoiceLink)}"
        >
          View Invoice
        </a>


        <a
          class="
            button
            button-primary
          "
          href="${escapeHtml_(result.paymentLink)}"
        >
          Proceed to Payment
        </a>

      </div>

    </div>
  `;


  return pageShell_(

    "Refill Confirmed",

    "Your order and invoice have been created successfully.",

    content

  );
}


/********************************************************
 * PROFESSIONAL INVOICE PAGE
 ********************************************************/

function invoicePage_(
  data
) {

  const invoiceDate =
    data.invoiceDate
      ? Utilities.formatDate(

          new Date(
            data.invoiceDate
          ),

          CONFIG.TIMEZONE,

          "dd MMM yyyy"

        )
      : "-";


  const amount =
    Number(
      data.amount || 0
    ).toFixed(
      2
    );


  const isPaid =
    String(
      data.invoiceStatus || ""
    ).trim() ===
    CONFIG.STATUS.PAID;


  let itemRows =
    "";


  (
    data.items || []
  ).forEach(

    item => {

      itemRows += `

        <tr>

          <td>
            ${escapeHtml_(item.drugName)}
          </td>

          <td>
            ${escapeHtml_(item.quantity)}
          </td>

          <td>
            GHS ${
              Number(
                item.unitPrice || 0
              ).toFixed(
                2
              )
            }
          </td>

          <td>
            GHS ${
              Number(
                item.total || 0
              ).toFixed(
                2
              )
            }
          </td>

        </tr>
      `;

    }

  );


  const statusBadge =
    isPaid

      ? `

        <span class="success-badge">
          ✓ PAID
        </span>

      `

      : `

        <span class="pending-badge">
          PAYMENT PENDING
        </span>

      `;


  const actionArea =
    isPaid

      ? `

        <div class="success-notice">

          This invoice has been paid
          successfully.

          ${
            data.receiptStatus ===
            CONFIG.STATUS.GENERATED

              ? `

                <br><br>

                Your receipt has already
                been generated.

              `

              : ""
          }

        </div>


        ${
          data.receiptPdfLink

            ? `

              <div class="single-action">

                <a
                  class="
                    button
                    button-secondary
                  "
                  href="${escapeHtml_(data.receiptPdfLink)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Receipt
                </a>

              </div>

            `

            : ""
        }

      `

      : `

        <div class="notice">

          This invoice is currently

          <strong>
            Pending
          </strong>.

          Payment must be completed
          and verified before the order
          is marked as completed.

        </div>


        <div class="single-action">

          <a
            class="
              button
              button-primary
            "
            href="${escapeHtml_(data.paymentLink)}"
          >
            Proceed to Payment
          </a>

        </div>

      `;


  const content = `

    <div class="card">

      ${statusBadge}


      <div class="invoice-top">

        <div class="invoice-box">

          <div class="invoice-box-title">
            Invoice Details
          </div>


          <div class="invoice-line">

            <strong>
              Invoice ID:
            </strong>

            ${escapeHtml_(data.invoiceId)}

          </div>


          <div class="invoice-line">

            <strong>
              Order ID:
            </strong>

            ${escapeHtml_(data.orderId)}

          </div>


          <div class="invoice-line">

            <strong>
              Invoice Date:
            </strong>

            ${escapeHtml_(invoiceDate)}

          </div>


          <div class="invoice-line">

            <strong>
              Status:
            </strong>

            ${escapeHtml_(data.invoiceStatus)}

          </div>

        </div>


        <div class="invoice-box">

          <div class="invoice-box-title">
            Patient Details
          </div>


          <div class="invoice-line">

            <strong>
              Name:
            </strong>

            ${escapeHtml_(data.patientName)}

          </div>


          <div class="invoice-line">

            <strong>
              Patient ID:
            </strong>

            ${escapeHtml_(data.patientId)}

          </div>


          <div class="invoice-line">

            <strong>
              Customer Type:
            </strong>

            ${escapeHtml_(data.customerType)}

          </div>

        </div>

      </div>


      <h2 class="section-title">
        Invoice Items
      </h2>


      <div class="invoice-table-wrap">

        <table class="invoice-table">

          <thead>

            <tr>

              <th>
                Medication
              </th>

              <th>
                Qty
              </th>

              <th>
                Unit Price
              </th>

              <th>
                Total
              </th>

            </tr>

          </thead>


          <tbody>

            ${itemRows}

          </tbody>

        </table>

      </div>


      <div class="invoice-total">

        <div class="invoice-total-row">

          <span>
            Subtotal
          </span>

          <strong>
            GHS ${escapeHtml_(amount)}
          </strong>

        </div>


        <div class="invoice-total-row">

          <span>
            Service Charge
          </span>

          <strong>
            GHS 0.00
          </strong>

        </div>


        <div class="
          invoice-total-row
          final
        ">

          <span>
            Total Due
          </span>

          <span>
            GHS ${escapeHtml_(amount)}
          </span>

        </div>

      </div>


      ${actionArea}

    </div>
  `;


  return pageShell_(

    "Invoice",

    "Invoice " +
    data.invoiceId,

    content

  );
}


/********************************************************
 * PAYMENT CENTRE
 ********************************************************/

function paymentCentrePage_(
  context,
  settings
) {

  const amount =
    Number(
      context.amount || 0
    ).toFixed(
      2
    );


  const momoNumber =
    String(
      settings.Pharmacy_MoMo_Number || ""
    );


  const bankName =
    String(
      settings.Bank_Name || "GCB"
    );


  const bankAccountName =
    String(
      settings.Bank_Account_Name || ""
    );


  const bankAccountNumber =
    String(
      settings.Bank_Account_Number || ""
    );


  const paymentToken =
    createToken_(

      "PAYMENT:" +
      context.orderId

    );


  const paystackUrl =
    buildPublicUrl_(

      "paystack-start",

      {

        orderId:
          context.orderId,

        token:
          paymentToken

      }

    );


  const formAction =
    webAppUrl_();


  const content = `

    <div class="card">

      <span class="pending-badge">
        PAYMENT PENDING
      </span>


      <div class="text">

        Hello

        <strong>
          ${escapeHtml_(context.patientName)}
        </strong>.

        Choose your preferred
        payment method.

      </div>


      <div class="summary">

        <div class="summary-row">

          <div class="summary-label">
            Order ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(context.orderId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Invoice ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(context.invoiceId)}
          </div>

        </div>

      </div>


      <div class="amount-box">

        <div class="amount-label">
          Amount Due
        </div>

        <div class="amount-value">
          GHS ${escapeHtml_(amount)}
        </div>

      </div>


      <h2 class="payment-title">
        Payment Method
      </h2>


      <p class="payment-description">

        Select Mobile Money or submit
        your GCB bank transfer reference.

      </p>


      <div class="payment-grid">


        <div class="payment-card">

          <div class="payment-icon">
            M
          </div>


          <div class="payment-name">
            Mobile Money
          </div>


          <div class="payment-info">

            Pay securely through
            Paystack Test Mode.


            <div class="detail-line">

              <strong>
                Pharmacy MoMo:
              </strong>

              ${escapeHtml_(momoNumber)}

            </div>

          </div>


          <div class="single-action">

            <a
              class="
                button
                button-primary
              "
              href="${escapeHtml_(paystackUrl)}"
            >
              Pay with Paystack
            </a>

          </div>

        </div>


        <div class="payment-card">

          <div class="
            payment-icon
            bank-icon
          ">
            G
          </div>


          <div class="payment-name">
            ${escapeHtml_(bankName)} Bank
          </div>


          <div class="payment-info">

            Transfer the exact amount
            shown above to the pharmacy
            account.

          </div>


          <div class="bank-details">

            <div class="detail-line">

              <strong>
                Bank:
              </strong>

              ${escapeHtml_(bankName)}

            </div>


            <div class="detail-line">

              <strong>
                Account Name:
              </strong>

              ${escapeHtml_(bankAccountName)}

            </div>


            <div class="detail-line">

              <strong>
                Account Number:
              </strong>

              ${escapeHtml_(bankAccountNumber)}

            </div>

          </div>


          <form
            method="post"
            action="${escapeHtml_(formAction)}"
          >

            <input
              type="hidden"
              name="action"
              value="bank-transfer-submit"
            >

            <input
              type="hidden"
              name="orderId"
              value="${escapeHtml_(context.orderId)}"
            >

            <input
              type="hidden"
              name="token"
              value="${escapeHtml_(paymentToken)}"
            >


            <div class="form-group">

              <label
                class="form-label"
                for="transferReference"
              >
                Transfer Reference
              </label>


              <input
                class="form-input"
                id="transferReference"
                name="transferReference"
                type="text"
                minlength="4"
                maxlength="80"
                required
                autocomplete="off"
                placeholder="Enter your GCB transfer reference"
              >


              <div class="form-help">

                Enter the reference shown
                after completing your
                bank transfer.

              </div>

            </div>


            <div class="single-action">

              <button
                class="
                  button
                  button-bank
                "
                type="submit"
              >
                Submit Bank Transfer
              </button>

            </div>

          </form>

        </div>

      </div>


      <div class="notice">

        Paystack payments become

        <strong>
          Paid
        </strong>

        only after verification.

        <br><br>

        GCB transfers remain

        <strong>
          Pending
        </strong>

        until separately verified.

      </div>

    </div>
  `;


  return pageShell_(

    "Payment Centre",

    "Choose how you would like to pay.",

    content

  );
}


/********************************************************
 * PAYMENT VERIFIED PAGE
 ********************************************************/

function paymentVerifiedPage_(
  result
) {

  const amount =
    Number(
      result.amount || 0
    ).toFixed(
      2
    );


  const invoice =
    findRecord_(

      "Invoices_Receipts",

      "Order_ID",

      result.orderId

    );


  const invoiceLink =
    invoice

      ? String(
          invoice.Invoice_Link || ""
        ).trim()

      : "";


  const receiptLink =
    invoice

      ? String(
          invoice.Receipt_PDF_Link || ""
        ).trim()

      : "";


  const content = `

    <div class="card">

      <span class="success-badge">
        ✓ PAYMENT VERIFIED
      </span>


      <div class="text">

        Your payment has been
        verified successfully.

      </div>


      <div class="summary">

        <div class="summary-row">

          <div class="summary-label">
            Payment ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.paymentId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Order ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.orderId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Amount Paid
          </div>

          <div class="summary-value">
            GHS ${escapeHtml_(amount)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Payment Status
          </div>

          <div class="summary-value">
            Paid
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Order Status
          </div>

          <div class="summary-value">
            Completed
          </div>

        </div>

      </div>


      <div class="payment-actions">

        ${
          invoiceLink

            ? `

              <a
                class="
                  success-download-btn
                  invoice-download-btn
                "
                href="${escapeHtml_(invoiceLink)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Invoice
              </a>

            `

            : ""
        }


        ${
          receiptLink

            ? `

              <a
                class="
                  success-download-btn
                  receipt-download-btn
                "
                href="${escapeHtml_(receiptLink)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Receipt
              </a>

            `

            : ""
        }

      </div>


      <div class="success-notice">

        Payment verification succeeded.

        Your order has been completed
        and your invoice marked Paid.

        ${
          result.receiptGenerated

            ? `

              <br><br>

              Your official receipt has
              been generated automatically
              and sent to your email.

            `

            : ""
        }

      </div>

    </div>
  `;


  return pageShell_(

    "Payment Successful",

    "Your payment has been verified securely.",

    content

  );
}


/********************************************************
 * PAYMENT VERIFICATION FAILED
 ********************************************************/

function paymentVerificationFailedPage_(
  message
) {

  const content = `

    <div class="card">

      <span class="failed-badge">
        PAYMENT NOT VERIFIED
      </span>


      <div class="text">

        We could not confirm this
        payment as successful.

      </div>


      <div class="error-notice">

        ${escapeHtml_(message)}

      </div>


      <div class="notice">

        Your order remains

        <strong>
          Pending
        </strong>

        until payment is verified.

      </div>

    </div>
  `;


  return pageShell_(

    "Payment Verification",

    "Dr. Evans Pharmacy",

    content

  );
}


/********************************************************
 * BANK TRANSFER SUBMITTED PAGE
 ********************************************************/

function bankTransferSubmittedPage_(
  result
) {

  const amount =
    Number(
      result.amount || 0
    ).toFixed(
      2
    );


  const content = `

    <div class="card">

      <span class="pending-badge">
        BANK TRANSFER PENDING
      </span>


      <div class="text">

        Thank you,

        <strong>
          ${escapeHtml_(result.patientName)}
        </strong>.

        Your GCB transfer information
        has been submitted successfully.

      </div>


      <div class="summary">

        <div class="summary-row">

          <div class="summary-label">
            Payment ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.paymentId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Order ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.orderId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Invoice ID
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.invoiceId)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Amount
          </div>

          <div class="summary-value">
            GHS ${escapeHtml_(amount)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Transfer Reference
          </div>

          <div class="summary-value">
            ${escapeHtml_(result.transferReference)}
          </div>

        </div>


        <div class="summary-row">

          <div class="summary-label">
            Status
          </div>

          <div class="summary-value">
            Pending Verification
          </div>

        </div>

      </div>


      <div class="notice">

        Your payment remains

        <strong>
          Pending
        </strong>

        until the GCB transfer
        has been verified.

        <br><br>

        A receipt will only be generated
        after successful verification.

      </div>

    </div>
  `;


  return pageShell_(

    "Bank Transfer Submitted",

    "Your transfer information has been received.",

    content

  );
}


/********************************************************
 * COMING SOON PAGE
 ********************************************************/

function comingSoonPage_(
  feature
) {

  return pageShell_(

    feature,

    "Dr. Evans Pharmacy",

    `

      <div class="card">

        <div
          class="text"
          style="margin-top:0;"
        >

          ${escapeHtml_(feature)}
          is being prepared.

        </div>

      </div>

    `

  );
}


/********************************************************
 * ERROR PAGE
 ********************************************************/

function errorPage_(
  title,
  message
) {

  return pageShell_(

    title,

    "Dr. Evans Pharmacy",

    `

      <div class="card">

        <span class="failed-badge">
          REQUEST NOT COMPLETED
        </span>


        <div class="error-notice">

          ${escapeHtml_(message)}

        </div>

      </div>

    `

  );
}


/********************************************************
 * HTML ESCAPE
 ********************************************************/

function escapeHtml_(
  value
) {

  return String(

    value === null ||
    value === undefined

      ? ""

      : value

  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#39;"
    );
}
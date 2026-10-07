/**
 * ============================================================
 * DR. EVANS PHARMACY
 * ARKESEL VOICE COMMUNICATION ENGINE
 * ============================================================
 *
 * Uses a prerecorded audio file stored in Google Drive.
 *
 * FLOW:
 *
 * Google Drive Audio File
 *        ↓
 * DriveApp.getFileById()
 *        ↓
 * Actual Audio Blob
 *        ↓
 * multipart/form-data upload
 *        ↓
 * Arkesel Voice API
 *
 * IMPORTANT:
 * - NO text-to-speech
 * - NO public audio URL
 * - The actual audio file is uploaded to Arkesel
 * - Demo safety remains active
 * - Call_Log remains connected
 */


/********************************************************
 * VOICE CONFIGURATION
 ********************************************************/

const VOICE_CONFIG = {

  /**
   * Arkesel Voice API
   */
  ARKESEL_ENDPOINT:
    "https://sms.arkesel.com/api/v2/sms/voice/send",


  /**
   * Existing Script Property
   */
  API_KEY_PROPERTY:
    "ARKESEL_API_KEY",


  /**
   * NEW GOOGLE DRIVE AUDIO FILE
   *
   * Link supplied:
   *
   * https://drive.google.com/file/d/
   * 1Bn6MOtIfmtaY6LOdYq5xXMctclgONpba/view
   */
  VOICE_FILE_ID:
    "1Bn6MOtIfmtaY6LOdYq5xXMctclgONpba",


  /**
   * Sender identity
   */
  SENDER_ID:
    "DrEvans",


  /**
   * Only approved demo patients
   * may receive real calls.
   */
  SAFE_TEST_PATIENT_IDS: [
    "P001",
    "P011"
  ]

};


/********************************************************
 * NORMALIZE GHANA PHONE NUMBER
 *
 * Accepted:
 *
 * 0599353433
 * +233599353433
 * 233599353433
 *
 * Returned:
 *
 * 233599353433
 ********************************************************/

function normalizeVoicePhone_(
  phone
) {

  if (!phone) {

    throw new Error(
      "Voice phone number is missing."
    );
  }


  let cleaned =
    String(
      phone
    )
      .trim()
      .replace(
        /\s+/g,
        ""
      )
      .replace(
        /-/g,
        ""
      )
      .replace(
        /\(/g,
        ""
      )
      .replace(
        /\)/g,
        ""
      );


  if (
    cleaned.startsWith("+")
  ) {

    cleaned =
      cleaned.substring(1);
  }


  if (
    cleaned.startsWith("0")
  ) {

    cleaned =
      "233" +
      cleaned.substring(1);
  }


  if (
    !/^233\d{9}$/.test(
      cleaned
    )
  ) {

    throw new Error(
      "Invalid Ghana phone number. " +
      "Use 0XXXXXXXXX, " +
      "233XXXXXXXXX or +233XXXXXXXXX."
    );
  }


  return cleaned;
}


/********************************************************
 * GET ARKESEL API KEY
 ********************************************************/

function getArkeselVoiceApiKey_() {

  const apiKey =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        VOICE_CONFIG
          .API_KEY_PROPERTY
      );


  if (!apiKey) {

    throw new Error(
      "ARKESEL_API_KEY was not found " +
      "in Script Properties."
    );
  }


  return String(
    apiKey
  ).trim();
}


/********************************************************
 * DEMO PATIENT SAFETY
 ********************************************************/

function voiceDemoPatientAllowed_(
  patientId
) {

  const cleanPatientId =
    String(
      patientId || ""
    ).trim();


  /**
   * Use existing Messaging.gs
   * demo safety if available.
   */
  if (
    typeof isApprovedDemoPatient_ ===
    "function"
  ) {

    return isApprovedDemoPatient_(
      cleanPatientId
    );
  }


  /**
   * Use MESSAGING_DEMO if available.
   */
  if (
    typeof MESSAGING_DEMO !==
      "undefined" &&
    MESSAGING_DEMO &&
    MESSAGING_DEMO.ENABLED === true
  ) {

    const allowed =
      MESSAGING_DEMO
        .ALLOWED_TEST_PATIENT_IDS ||
      [];


    return (
      allowed.indexOf(
        cleanPatientId
      ) !== -1
    );
  }


  /**
   * Final safe fallback.
   */
  return (
    VOICE_CONFIG
      .SAFE_TEST_PATIENT_IDS
      .indexOf(
        cleanPatientId
      ) !== -1
  );
}


/********************************************************
 * GET ACTUAL AUDIO FILE FROM GOOGLE DRIVE
 *
 * Returns a real Blob.
 *
 * This is required because Arkesel said:
 *
 * "The voice file must be a file."
 ********************************************************/

function getVoiceAudioBlob_() {

  const fileId =
    String(
      VOICE_CONFIG
        .VOICE_FILE_ID || ""
    ).trim();


  if (!fileId) {

    throw new Error(
      "VOICE_FILE_ID is missing."
    );
  }


  let file;


  try {

    file =
      DriveApp
        .getFileById(
          fileId
        );

  }

  catch (error) {

    throw new Error(
      "Unable to access the voice recording " +
      "in Google Drive. " +
      error.message
    );
  }


  const fileName =
    file.getName();


  const mimeType =
    file.getMimeType();


  const fileSize =
    file.getSize();


  if (
    fileSize <= 0
  ) {

    throw new Error(
      "The selected voice recording is empty."
    );
  }


  const blob =
    file.getBlob();


  /**
   * Preserve the original filename
   * for multipart upload.
   */
  blob.setName(
    fileName
  );


  Logger.log(
    "VOICE FILE CHECK"
  );


  Logger.log(
    "File Name: " +
    fileName
  );


  Logger.log(
    "MIME Type: " +
    mimeType
  );


  Logger.log(
    "File Size: " +
    fileSize +
    " bytes"
  );


  return blob;
}


/********************************************************
 * CREATE NEXT CALL LOG ID
 *
 * CALL001
 * CALL002
 * CALL003
 ********************************************************/

function createCallLogId_() {

  const sheet =
    sheet_(
      "Call_Log"
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return "CALL001";
  }


  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0]
      .map(
        value =>
          String(
            value || ""
          ).trim()
      );


  const callIdColumn =
    headers.indexOf(
      "Call_ID"
    );


  if (
    callIdColumn === -1
  ) {

    throw new Error(
      "Call_Log does not contain Call_ID."
    );
  }


  const ids =
    sheet
      .getRange(
        2,
        callIdColumn + 1,
        lastRow - 1,
        1
      )
      .getValues()
      .flat()
      .filter(
        String
      );


  let highest =
    0;


  ids.forEach(
    id => {

      const match =
        String(
          id
        ).match(
          /CALL(\d+)/i
        );


      if (match) {

        const number =
          Number(
            match[1]
          );


        if (
          number > highest
        ) {

          highest =
            number;
        }
      }

    }
  );


  return (
    "CALL" +
    String(
      highest + 1
    ).padStart(
      3,
      "0"
    )
  );
}


/********************************************************
 * VALIDATE CALL LOG STRUCTURE
 ********************************************************/

function validateCallLogStructure_() {

  const sheet =
    sheet_(
      "Call_Log"
    );


  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0]
      .map(
        value =>
          String(
            value || ""
          ).trim()
      );


  const required = [

    "Call_ID",

    "Patient_ID",

    "Phone",

    "Call_Type",

    "Call_Status"

  ];


  const missing =
    required.filter(
      header =>

        headers.indexOf(
          header
        ) === -1
    );


  if (
    missing.length > 0
  ) {

    throw new Error(
      "Call_Log is missing required column(s): " +
      missing.join(
        ", "
      )
    );
  }


  return {

    valid:
      true,

    headers:
      headers

  };
}


/********************************************************
 * LOG VOICE CALL
 ********************************************************/

function logVoiceCall_(
  details
) {

  const sheet =
    sheet_(
      "Call_Log"
    );


  const structure =
    validateCallLogStructure_();


  const headers =
    structure.headers;


  const callId =
    details.callId ||
    createCallLogId_();


  const now =
    new Date();


  const record = {

    Call_ID:
      callId,

    Timestamp:
      now,

    Call_Date:
      now,

    Patient_ID:
      details.patientId || "",

    Phone:
      details.phone || "",

    Preferred_Contact:
      details.preferredContact || "Voice",

    Call_Type:
      details.callType || "Voice Call",

    Campaign_ID:
      details.campaignId || "",

    Provider_Call_ID:
      details.providerCallId || "",

    Provider_Status:
      details.providerStatus || "",

    Call_Status:
      details.callStatus || "",

    Voice_File_ID:
      VOICE_CONFIG
        .VOICE_FILE_ID,

    Response:
      details.responseText || ""

  };


  const row =
    headers.map(
      header => {

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              record,
              header
            )
        ) {

          return record[
            header
          ];
        }


        return "";
      }
    );


  sheet.appendRow(
    row
  );


  SpreadsheetApp.flush();


  return callId;
}


/********************************************************
 * GET PROVIDER RESPONSE DATA
 ********************************************************/

function getVoiceResponseData_(
  responseJson
) {

  if (
    !responseJson ||
    !responseJson.data
  ) {

    return {};
  }


  if (
    Array.isArray(
      responseJson.data
    )
  ) {

    return (
      responseJson.data[0] ||
      {}
    );
  }


  return (
    responseJson.data ||
    {}
  );
}


/********************************************************
 * EXTRACT PROVIDER CALL ID
 ********************************************************/

function extractVoiceProviderCallId_(
  responseJson
) {

  const data =
    getVoiceResponseData_(
      responseJson
    );


  return String(

    data.call_id ||

    data.callId ||

    data.id ||

    responseJson.call_id ||

    ""

  ).trim();
}


/********************************************************
 * EXTRACT PROVIDER CAMPAIGN ID
 ********************************************************/

function extractVoiceCampaignId_(
  responseJson
) {

  const data =
    getVoiceResponseData_(
      responseJson
    );


  return String(

    data.campaign_id ||

    data.campaignId ||

    responseJson.campaign_id ||

    ""

  ).trim();
}


/********************************************************
 * EXTRACT PROVIDER STATUS
 ********************************************************/

function extractVoiceProviderStatus_(
  responseJson
) {

  const data =
    getVoiceResponseData_(
      responseJson
    );


  return String(

    data.status ||

    responseJson.status ||

    ""

  ).trim();
}


/********************************************************
 * CHECK WHETHER RESPONSE IS SUCCESSFUL
 ********************************************************/

function voiceResponseSuccessful_(
  responseCode,
  responseJson
) {

  if (
    responseCode < 200 ||
    responseCode >= 300
  ) {

    return false;
  }


  const topStatus =
    String(
      responseJson.status || ""
    )
      .trim()
      .toLowerCase();


  const providerStatus =
    extractVoiceProviderStatus_(
      responseJson
    )
      .toLowerCase();


  /**
   * Some APIs may return HTTP 2xx
   * without a status property.
   */
  if (
    !topStatus &&
    !providerStatus
  ) {

    return true;
  }


  return (

    topStatus === "success" ||

    providerStatus === "success" ||

    providerStatus === "queued" ||

    providerStatus === "submitted" ||

    providerStatus === "pending"

  );
}


/********************************************************
 * SEND MULTIPART REQUEST TO ARKESEL
 *
 * CRITICAL:
 *
 * Do NOT set:
 *
 * contentType: "application/json"
 *
 * because voice_file must be sent
 * as an actual multipart file.
 ********************************************************/

function performArkeselVoiceRequest_(
  recipient,
  audioBlob
) {

  const apiKey =
    getArkeselVoiceApiKey_();


  /**
   * Blob inside payload tells
   * UrlFetchApp to build multipart/form-data.
   */
  const payload = {

    /**
     * Your live API originally said:
     *
     * "The recipients field is required."
     *
     * For multipart arrays we use:
     *
     * recipients[]
     */
    "recipients[]":
      recipient,


    /**
     * Actual binary audio file.
     */
    voice_file:
      audioBlob,


    /**
     * Pharmacy sender ID.
     */
    sender_id:
      VOICE_CONFIG
        .SENDER_ID

  };


  const options = {

    method:
      "post",

    headers: {

      "api-key":
        apiKey

    },

    payload:
      payload,

    muteHttpExceptions:
      true

  };


  const response =
    UrlFetchApp.fetch(

      VOICE_CONFIG
        .ARKESEL_ENDPOINT,

      options

    );


  const responseCode =
    response
      .getResponseCode();


  const responseText =
    response
      .getContentText();


  let responseJson =
    {};


  try {

    responseJson =
      JSON.parse(
        responseText
      );

  }

  catch (error) {

    responseJson =
      {};
  }


  return {

    responseCode:
      responseCode,

    responseText:
      responseText,

    responseJson:
      responseJson

  };
}


/********************************************************
 * SEND REAL ARKESEL VOICE CALL
 *
 * REQUIRED BY REFILLS.GS
 *
 * Keep this function name unchanged.
 ********************************************************/

function sendArkeselVoiceCall_(
  phone,
  patientId,
  preferredContact,
  callType
) {

  const cleanPatientId =
    String(
      patientId || ""
    ).trim();


  if (!cleanPatientId) {

    throw new Error(
      "Patient ID is required."
    );
  }


  /******************************************************
   * DEMO SAFETY
   ******************************************************/

  if (
    !voiceDemoPatientAllowed_(
      cleanPatientId
    )
  ) {

    throw new Error(
      "DEMO SAFETY: Voice calls are restricted " +
      "to approved test patients."
    );
  }


  const recipient =
    normalizeVoicePhone_(
      phone
    );


  const cleanPreferredContact =
    String(
      preferredContact ||
      "Voice"
    ).trim();


  const cleanCallType =
    String(
      callType ||
      "Voice Reminder"
    ).trim();


  /******************************************************
   * READ THE ACTUAL AUDIO FILE
   ******************************************************/

  const audioBlob =
    getVoiceAudioBlob_();


  let result;


  try {

    result =
      performArkeselVoiceRequest_(

        recipient,

        audioBlob

      );

  }

  catch (error) {

    const failedCallId =
      logVoiceCall_({

        patientId:
          cleanPatientId,

        phone:
          recipient,

        preferredContact:
          cleanPreferredContact,

        callType:
          cleanCallType,

        providerStatus:
          "REQUEST FAILED",

        callStatus:
          "FAILED",

        responseText:
          error.message

      });


    throw new Error(
      "Arkesel Voice connection failed. " +
      "Call Log: " +
      failedCallId +
      ". Error: " +
      error.message
    );
  }


  Logger.log(
    "Arkesel Voice HTTP Code: " +
    result.responseCode
  );


  Logger.log(
    "Arkesel Voice Response: " +
    result.responseText
  );


  /******************************************************
   * EXTRACT PROVIDER INFORMATION
   ******************************************************/

  const providerCallId =
    extractVoiceProviderCallId_(
      result.responseJson
    );


  const campaignId =
    extractVoiceCampaignId_(
      result.responseJson
    );


  const providerStatus =
    extractVoiceProviderStatus_(
      result.responseJson
    );


  const successful =
    voiceResponseSuccessful_(
      result.responseCode,
      result.responseJson
    );


  /******************************************************
   * FAILED CALL SUBMISSION
   ******************************************************/

  if (
    !successful
  ) {

    const failedCallId =
      logVoiceCall_({

        patientId:
          cleanPatientId,

        phone:
          recipient,

        preferredContact:
          cleanPreferredContact,

        callType:
          cleanCallType,

        campaignId:
          campaignId,

        providerCallId:
          providerCallId,

        providerStatus:
          providerStatus ||
          "ERROR",

        callStatus:
          "FAILED",

        responseText:
          result.responseText

      });


    throw new Error(
      "Arkesel Voice rejected the request. " +
      "HTTP " +
      result.responseCode +
      ". Call Log: " +
      failedCallId +
      ". Response: " +
      result.responseText
    );
  }


  /******************************************************
   * SUCCESSFUL SUBMISSION
   ******************************************************/

  const callId =
    logVoiceCall_({

      patientId:
        cleanPatientId,

      phone:
        recipient,

      preferredContact:
        cleanPreferredContact,

      callType:
        cleanCallType,

      campaignId:
        campaignId,

      providerCallId:
        providerCallId,

      providerStatus:
        providerStatus ||
        "SUBMITTED",

      callStatus:
        "SUBMITTED",

      responseText:
        result.responseText

    });


  const output = {

    success:
      true,

    callId:
      callId,

    patientId:
      cleanPatientId,

    phone:
      recipient,

    preferredContact:
      cleanPreferredContact,

    callType:
      cleanCallType,

    campaignId:
      campaignId,

    providerCallId:
      providerCallId,

    providerStatus:
      providerStatus ||
      "SUBMITTED",

    responseCode:
      result.responseCode

  };


  Logger.log(
    "VOICE CALL SUCCESS"
  );


  Logger.log(
    JSON.stringify(
      output,
      null,
      2
    )
  );


  return output;
}


/********************************************************
 * CHECK NEW DRIVE AUDIO FILE
 *
 * SAFE:
 * DOES NOT PLACE A CALL
 ********************************************************/

function checkVoiceAudioFile() {

  const file =
    DriveApp
      .getFileById(
        VOICE_CONFIG
          .VOICE_FILE_ID
      );


  const result = {

    accessible:
      true,

    fileId:
      file.getId(),

    fileName:
      file.getName(),

    mimeType:
      file.getMimeType(),

    sizeBytes:
      file.getSize(),

    sizeMB:
      Number(
        (
          file.getSize() /
          1024 /
          1024
        ).toFixed(2)
      )

  };


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}


/********************************************************
 * SAFE VOICE CONFIGURATION CHECK
 *
 * DOES NOT PLACE A CALL
 ********************************************************/

function checkVoiceConfiguration() {

  const apiKey =
    getArkeselVoiceApiKey_();


  const callLog =
    validateCallLogStructure_();


  const audio =
    checkVoiceAudioFile();


  const result = {

    voiceEngineLoaded:
      true,

    apiKeyConfigured:
      Boolean(
        apiKey
      ),

    endpoint:
      VOICE_CONFIG
        .ARKESEL_ENDPOINT,

    senderId:
      VOICE_CONFIG
        .SENDER_ID,

    driveFileId:
      VOICE_CONFIG
        .VOICE_FILE_ID,

    audioFileAccessible:
      audio.accessible,

    audioFileName:
      audio.fileName,

    audioMimeType:
      audio.mimeType,

    audioSizeMB:
      audio.sizeMB,

    callLogValid:
      callLog.valid,

    approvedTestPatients:
      VOICE_CONFIG
        .SAFE_TEST_PATIENT_IDS

  };


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}


/********************************************************
 * SAFE P001 VOICE READINESS CHECK
 *
 * DOES NOT PLACE A CALL
 ********************************************************/

function checkP001VoiceTestReadiness() {

  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      "P001"
    );


  if (!patient) {

    throw new Error(
      "P001 was not found in Patients."
    );
  }


  const phone =
    String(
      patient.Phone || ""
    ).trim();


  if (!phone) {

    throw new Error(
      "P001 does not contain a phone number."
    );
  }


  const normalizedPhone =
    normalizeVoicePhone_(
      phone
    );


  const configuration =
    checkVoiceConfiguration();


  const demoApproved =
    voiceDemoPatientAllowed_(
      "P001"
    );


  const result = {

    patientId:
      "P001",

    patientName:
      String(
        patient.Full_Name || ""
      ),

    phoneExists:
      true,

    normalizedPhone:
      normalizedPhone,

    demoApproved:
      demoApproved,

    apiKeyConfigured:
      configuration
        .apiKeyConfigured,

    audioFileAccessible:
      configuration
        .audioFileAccessible,

    audioFileName:
      configuration
        .audioFileName,

    audioMimeType:
      configuration
        .audioMimeType,

    audioSizeMB:
      configuration
        .audioSizeMB,

    callLogValid:
      configuration
        .callLogValid,

    ready:
      (
        demoApproved === true &&
        configuration
          .apiKeyConfigured === true &&
        configuration
          .audioFileAccessible === true &&
        configuration
          .callLogValid === true
      )

  };


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}


/********************************************************
 * REAL TEST CALL TO P001
 *
 * WARNING:
 *
 * THIS SUBMITS A REAL OUTBOUND CALL.
 *
 * Confirm P001 contains your test number
 * before running.
 ********************************************************/

function testArkeselVoiceWithP001() {

  const readiness =
    checkP001VoiceTestReadiness();


  if (
    readiness.ready !== true
  ) {

    throw new Error(
      "P001 voice test is not ready. " +
      "Run checkP001VoiceTestReadiness first."
    );
  }


  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      "P001"
    );


  const result =
    sendArkeselVoiceCall_(

      patient.Phone,

      "P001",

      "Voice",

      "Voice API Test - P001"

    );


  /******************************************************
   * AUDIT LOG
   ******************************************************/

  logAudit_({

    userType:
      "System",

    userId:
      "P001",

    action:
      "VOICE API TEST SENT",

    recordType:
      "Patient",

    recordId:
      "P001",

    details:
      "Real prerecorded voice test submitted. " +
      "Call Log: " +
      result.callId +
      ". Provider Call ID: " +
      (
        result.providerCallId ||
        "Not returned"
      ) +
      ". Campaign ID: " +
      (
        result.campaignId ||
        "Not returned"
      ) +
      "."

  });


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}


/********************************************************
 * CHECK LATEST VOICE CALL LOG
 *
 * DOES NOT PLACE A CALL
 ********************************************************/

function checkLatestVoiceCallLog() {

  const calls =
    tableRows_(
      "Call_Log"
    );


  if (
    calls.length === 0
  ) {

    const result = {

      found:
        false,

      message:
        "No Call_Log records exist."

    };


    Logger.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );


    return result;
  }


  const latest =
    calls[
      calls.length - 1
    ];


  Logger.log(
    JSON.stringify(
      latest,
      null,
      2
    )
  );


  return latest;
}
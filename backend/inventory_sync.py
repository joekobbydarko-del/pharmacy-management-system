import gzip

import json

import os

import socket

import ssl

import time



from datetime import datetime

from urllib.error import HTTPError, URLError

from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

from urllib.request import Request, urlopen



from dotenv import load_dotenv

from sqlalchemy.orm import Session



from inventory_models import Drug, InventoryItem





load_dotenv()





# ============================================================

# NETWORK CONFIGURATION

# ============================================================



GOOGLE_REQUEST_TIMEOUT = 90

GOOGLE_REQUEST_RETRIES = 3

GOOGLE_MAX_REDIRECTS = 8

GOOGLE_RETRY_DELAYS = (1.5, 3.0, 5.0)

GOOGLE_DNS_IPS = ("8.8.8.8", "8.8.4.4")





# ============================================================

# DATETIME

# ============================================================



def parse_datetime(value):

    if not value:

        return None



    try:

        return datetime.fromisoformat(

            str(value).replace("Z", "+00:00")

        )

    except (ValueError, TypeError):

        return None





# ============================================================

# ENVIRONMENT

# ============================================================



def get_google_settings():

    base_url = os.getenv("GOOGLE_APPS_SCRIPT_URL")

    sync_key = os.getenv("GOOGLE_APPS_SCRIPT_SYNC_KEY")



    if not base_url:

        raise RuntimeError(

            "GOOGLE_APPS_SCRIPT_URL is missing from .env"

        )



    if not sync_key:

        raise RuntimeError(

            "GOOGLE_APPS_SCRIPT_SYNC_KEY is missing from .env"

        )



    base_url = str(base_url).strip()

    sync_key = str(sync_key).strip()



    if not base_url:

        raise RuntimeError(

            "GOOGLE_APPS_SCRIPT_URL is empty in .env"

        )



    if not sync_key:

        raise RuntimeError(

            "GOOGLE_APPS_SCRIPT_SYNC_KEY is empty in .env"

        )



    return base_url, sync_key





# ============================================================

# GOOGLE ACTION URLS

# ============================================================



def build_google_action_url(

    base_url,

    sync_key,

    action,

):

    parsed = urlparse(str(base_url).strip())



    if parsed.scheme.lower() != "https":

        raise RuntimeError(

            "Google Apps Script URL must use HTTPS."

        )



    if not parsed.hostname:

        raise RuntimeError(

            "Google Apps Script URL is invalid."

        )



    query = dict(

        parse_qsl(

            parsed.query,

            keep_blank_values=True,

        )

    )



    query.update(

        {

            "action": str(action).strip(),

            "key": str(sync_key).strip(),

        }

    )



    return urlunparse(

        (

            parsed.scheme,

            parsed.netloc,

            parsed.path,

            parsed.params,

            urlencode(query),

            parsed.fragment,

        )

    )





def build_google_inventory_url(

    base_url,

    sync_key,

):

    return build_google_action_url(

        base_url,

        sync_key,

        "admin-dashboard",

    )





def build_google_admin_dashboard_url(

    base_url,

    sync_key,

):

    return build_google_action_url(

        base_url,

        sync_key,

        "admin-dashboard",

    )





def build_google_admin_pos_products_url(

    base_url,

    sync_key,

):

    return build_google_action_url(

        base_url,

        sync_key,

        "admin-pos-products",

    )





def build_google_admin_pos_sales_url(

    base_url,

    sync_key,

):

    return build_google_action_url(

        base_url,

        sync_key,

        "admin-pos-sales",

    )





def build_google_admin_pos_checkout_url(

    base_url,

    sync_key,

):

    return build_google_action_url(

        base_url,

        sync_key,

        "admin-pos-checkout",

    )





# ============================================================

# GOOGLE PAYLOAD HELPERS

# ============================================================



def validate_google_payload(

    payload,

    context="Google request",

):

    if not isinstance(payload, dict):

        raise RuntimeError(

            f"{context} returned an unexpected response."

        )



    if not payload.get("ok"):

        error_message = (

            payload.get("error")

            or payload.get("detail")

            or f"{context} failed."

        )



        raise RuntimeError(str(error_message))



    return payload





def decode_google_json(

    raw,

    context,

):

    if isinstance(raw, bytes):

        try:

            text = raw.decode("utf-8")

        except UnicodeDecodeError:

            text = raw.decode(

                "utf-8",

                errors="replace",

            )

    else:

        text = str(raw)



    text = text.strip()



    if not text:

        raise RuntimeError(

            f"{context} returned an empty response."

        )



    try:

        return json.loads(text)



    except json.JSONDecodeError as exc:

        preview = (

            text[:300]

            .replace("\n", " ")

            .replace("\r", " ")

        )



        raise RuntimeError(

            f"{context} returned invalid JSON. "

            f"Response started with: {preview}"

        ) from exc





def encode_google_json(payload):

    if payload is None:

        return None



    return json.dumps(payload).encode("utf-8")





def should_fail_fast_google_error(message):

    lower_message = str(message).lower()



    return (

        "unauthorized" in lower_message

        or "sync key" in lower_message

        or "not configured" in lower_message

    )





# ============================================================

# PRIMARY GOOGLE REQUEST

# ============================================================



def fetch_google_primary(

    url,

    method="GET",

    payload=None,

):

    method = str(

        method or "GET"

    ).upper()



    body = (

        encode_google_json(payload)

        if method != "GET"

        else None

    )



    headers = {

        "Accept": "application/json",

        "Accept-Encoding": "identity",

        "User-Agent": "DrEvansPharmacy/1.0",

        "Connection": "close",

    }



    if body is not None:

        headers[

            "Content-Type"

        ] = (

            "application/json; charset=utf-8"

        )



    request = Request(

        url,

        data=body,

        method=method,

        headers=headers,

    )



    try:

        with urlopen(

            request,

            timeout=GOOGLE_REQUEST_TIMEOUT,

        ) as response:

            raw = response.read()



        return decode_google_json(

            raw,

            "Google Apps Script",

        )



    except HTTPError as exc:

        try:

            response_body = (

                exc.read()

                .decode(

                    "utf-8",

                    errors="replace",

                )

            )

        except Exception:

            response_body = ""



        raise RuntimeError(

            "Google Apps Script returned "

            f"HTTP {exc.code}. "

            f"{response_body[:300]}"

        ) from exc



    except socket.timeout as exc:

        raise RuntimeError(

            "Google Apps Script request timed out "

            f"after {GOOGLE_REQUEST_TIMEOUT} seconds."

        ) from exc



    except TimeoutError as exc:

        raise RuntimeError(

            "Google Apps Script request timed out "

            f"after {GOOGLE_REQUEST_TIMEOUT} seconds."

        ) from exc



    except URLError as exc:

        reason = getattr(

            exc,

            "reason",

            exc,

        )



        raise RuntimeError(

            "Google Apps Script connection failed: "

            + str(reason)

        ) from exc





# ============================================================

# NORMAL IPV4 RESOLUTION

# ============================================================



def resolve_ipv4_normal(hostname):

    addresses = socket.getaddrinfo(

        hostname,

        443,

        socket.AF_INET,

        socket.SOCK_STREAM,

    )



    results = []



    for item in addresses:

        ip = item[4][0]



        if ip not in results:

            results.append(ip)



    return results





# ============================================================

# GOOGLE DNS-OVER-HTTPS FALLBACK

# ============================================================



def resolve_ipv4_google_doh(hostname):

    ssl_context = (

        ssl.create_default_context()

    )



    query = urlencode(

        {

            "name": hostname,

            "type": "A",

        }

    )



    path = (

        "/resolve?"

        + query

    )



    last_error = None



    for dns_ip in GOOGLE_DNS_IPS:

        raw_socket = None

        secure_socket = None



        try:

            raw_socket = (

                socket.create_connection(

                    (

                        dns_ip,

                        443,

                    ),

                    timeout=

                        GOOGLE_REQUEST_TIMEOUT,

                )

            )



            raw_socket.settimeout(

                GOOGLE_REQUEST_TIMEOUT

            )



            secure_socket = (

                ssl_context.wrap_socket(

                    raw_socket,

                    server_hostname=

                        "dns.google",

                )

            )



            secure_socket.settimeout(

                GOOGLE_REQUEST_TIMEOUT

            )



            request = (

                f"GET {path} HTTP/1.1\r\n"

                "Host: dns.google\r\n"

                "Accept: application/dns-json\r\n"

                "Accept-Encoding: identity\r\n"

                "User-Agent: DrEvansPharmacy/1.0\r\n"

                "Connection: close\r\n"

                "\r\n"

            )



            secure_socket.sendall(

                request.encode(

                    "ascii"

                )

            )



            response = (

                receive_http_response_(

                    secure_socket

                )

            )



            status = response[

                "status"

            ]



            body = response[

                "body"

            ]



            if status != 200:

                raise RuntimeError(

                    "Google DNS fallback returned "

                    f"HTTP {status}."

                )



            payload = (

                decode_google_json(

                    body,

                    "Google DNS fallback",

                )

            )



            results = []



            for answer in payload.get(

                "Answer",

                [],

            ):

                if (

                    answer.get(

                        "type"

                    )

                    != 1

                ):

                    continue



                ip = str(

                    answer.get(

                        "data",

                        "",

                    )

                ).strip()



                try:

                    socket.inet_aton(

                        ip

                    )



                except OSError:

                    continue



                if ip not in results:

                    results.append(

                        ip

                    )



            if results:

                return results



        except Exception as exc:

            last_error = exc



        finally:

            if secure_socket:

                try:

                    secure_socket.close()

                except Exception:

                    pass



            elif raw_socket:

                try:

                    raw_socket.close()

                except Exception:

                    pass



    if last_error:

        raise RuntimeError(

            "Google DNS fallback failed: "

            + str(

                last_error

            )

        ) from last_error



    raise RuntimeError(

        f"Unable to resolve {hostname}."

    )





# ============================================================

# RESOLVE HOST

# ============================================================



def resolve_ipv4(hostname):

    try:

        results = (

            resolve_ipv4_normal(

                hostname

            )

        )



        if results:

            return results



    except Exception:

        pass



    return (

        resolve_ipv4_google_doh(

            hostname

        )

    )





# ============================================================

# DECODE CHUNKED HTTP BODY

# ============================================================



def decode_chunked_body_(

    body,

):

    output = bytearray()

    position = 0

    body_length = len(

        body

    )



    while position < body_length:

        line_end = body.find(

            b"\r\n",

            position,

        )



        if line_end == -1:

            raise RuntimeError(

                "Invalid chunked HTTP response."

            )



        size_line = (

            body[

                position:

                line_end

            ]

            .split(

                b";",

                1,

            )[0]

            .strip()

        )



        try:

            chunk_size = int(

                size_line,

                16,

            )



        except ValueError as exc:

            raise RuntimeError(

                "Invalid chunk size in HTTP response."

            ) from exc



        position = (

            line_end + 2

        )



        if chunk_size == 0:

            break



        chunk_end = (

            position

            + chunk_size

        )



        if chunk_end > body_length:

            raise RuntimeError(

                "Incomplete chunked HTTP response."

            )



        output.extend(

            body[

                position:

                chunk_end

            ]

        )



        position = (

            chunk_end

            + 2

        )



    return bytes(

        output

    )





# ============================================================

# RECEIVE RAW HTTP RESPONSE

# ============================================================



def receive_http_response_(

    secure_socket,

):

    chunks = []



    while True:

        try:

            chunk = (

                secure_socket.recv(

                    65536

                )

            )



        except socket.timeout as exc:

            raise RuntimeError(

                "Fallback HTTP request timed out "

                f"after {GOOGLE_REQUEST_TIMEOUT} seconds."

            ) from exc



        if not chunk:

            break



        chunks.append(

            chunk

        )



    response = (

        b"".join(

            chunks

        )

    )



    if (

        b"\r\n\r\n"

        not in response

    ):

        raise RuntimeError(

            "Google fallback returned an invalid HTTP response."

        )



    header_bytes, body = (

        response.split(

            b"\r\n\r\n",

            1,

        )

    )



    header_text = (

        header_bytes.decode(

            "iso-8859-1",

            errors="replace",

        )

    )



    header_lines = (

        header_text.split(

            "\r\n"

        )

    )



    status_line = (

        header_lines[0]

    )



    status_parts = (

        status_line.split(

            " ",

            2,

        )

    )



    if len(

        status_parts

    ) < 2:

        raise RuntimeError(

            "Google fallback returned an invalid HTTP status."

        )



    try:

        status = int(

            status_parts[1]

        )



    except ValueError as exc:

        raise RuntimeError(

            "Google fallback returned an invalid HTTP status code."

        ) from exc



    headers = {}



    for line in header_lines[1:]:

        if ":" not in line:

            continue



        name, value = (

            line.split(

                ":",

                1,

            )

        )



        headers[

            name.strip().lower()

        ] = value.strip()



    transfer_encoding = (

        headers.get(

            "transfer-encoding",

            ""

        )

        .lower()

    )



    if (

        "chunked"

        in transfer_encoding

    ):

        body = (

            decode_chunked_body_(

                body

            )

        )



    content_encoding = (

        headers.get(

            "content-encoding",

            ""

        )

        .lower()

    )



    if (

        "gzip"

        in content_encoding

    ):

        body = gzip.decompress(

            body

        )



    return {

        "status":

            status,

        "headers":

            headers,

        "body":

            body,

    }





# ============================================================

# DIRECT HTTPS REQUEST

# ============================================================



def direct_https_request(

    url,

    method="GET",

    payload=None,

):

    parsed = urlparse(

        url

    )



    if (

        parsed.scheme.lower()

        != "https"

    ):

        raise RuntimeError(

            "Fallback request requires HTTPS."

        )



    hostname = (

        parsed.hostname

    )



    if not hostname:

        raise RuntimeError(

            "Fallback request URL is invalid."

        )



    port = (

        parsed.port

        or 443

    )



    path = (

        parsed.path

        or "/"

    )



    if parsed.query:

        path += (

            "?"

            + parsed.query

        )



    method = str(

        method

        or "GET"

    ).upper()



    body = (

        encode_google_json(

            payload

        )

        if method != "GET"

        else None

    )



    headers = {

        "Host":

            hostname,

        "Accept":

            "application/json",

        "Accept-Encoding":

            "identity",

        "User-Agent":

            "DrEvansPharmacy/1.0",

        "Connection":

            "close",

    }



    if body is not None:

        headers[

            "Content-Type"

        ] = (

            "application/json; charset=utf-8"

        )



        headers[

            "Content-Length"

        ] = str(

            len(body)

        )



    request_lines = [

        f"{method} {path} HTTP/1.1",

    ]



    for key, value in headers.items():

        request_lines.append(

            f"{key}: {value}"

        )



    request_text = (

        "\r\n".join(

            request_lines

        )

        + "\r\n\r\n"

    ).encode(

        "ascii"

    )



    request_body = (

        request_text

        + (

            body

            if body is not None

            else b""

        )

    )



    addresses = (

        resolve_ipv4(

            hostname

        )

    )



    ssl_context = (

        ssl.create_default_context()

    )



    last_error = None



    for ip in addresses:

        raw_socket = None

        secure_socket = None



        try:

            raw_socket = (

                socket.create_connection(

                    (

                        ip,

                        port,

                    ),

                    timeout=

                        GOOGLE_REQUEST_TIMEOUT,

                )

            )



            raw_socket.settimeout(

                GOOGLE_REQUEST_TIMEOUT

            )



            secure_socket = (

                ssl_context.wrap_socket(

                    raw_socket,

                    server_hostname=

                        hostname,

                )

            )



            secure_socket.settimeout(

                GOOGLE_REQUEST_TIMEOUT

            )



            secure_socket.sendall(

                request_body

            )



            return (

                receive_http_response_(

                    secure_socket

                )

            )



        except Exception as exc:

            last_error = exc



        finally:

            if secure_socket:

                try:

                    secure_socket.close()

                except Exception:

                    pass



            elif raw_socket:

                try:

                    raw_socket.close()

                except Exception:

                    pass



    if last_error:

        raise RuntimeError(

            "Direct Google connection failed: "

            + str(

                last_error

            )

        ) from last_error



    raise RuntimeError(

        f"Unable to connect to {hostname}."

    )





# ============================================================

# FALLBACK FETCH WITH REDIRECT SUPPORT

# ============================================================



def fetch_google_fallback(

    url,

    method="GET",

    payload=None,

):

    current_url = url



    current_method = str(

        method or "GET"

    ).upper()



    current_payload = payload



    for _ in range(

        GOOGLE_MAX_REDIRECTS

        + 1

    ):

        result = (

            direct_https_request(

                current_url,

                method=

                    current_method,

                payload=

                    current_payload,

            )

        )



        status = result[

            "status"

        ]



        headers = result[

            "headers"

        ]



        body = result[

            "body"

        ]



        if status in {

            301,

            302,

            303,

            307,

            308,

        }:

            location = (

                headers.get(

                    "location"

                )

            )



            if not location:

                raise RuntimeError(

                    "Google redirect did not contain a destination."

                )



            current_url = (

                urljoin(

                    current_url,

                    location,

                )

            )



            if status in {

                301,

                302,

                303,

            }:

                current_method = "GET"

                current_payload = None



            continue



        if (

            status < 200

            or

            status >= 300

        ):

            preview = (

                body[:300]

                .decode(

                    "utf-8",

                    errors="replace",

                )

            )



            raise RuntimeError(

                "Google Apps Script returned "

                f"HTTP {status}. "

                f"{preview}"

            )



        return (

            decode_google_json(

                body,

                "Google Apps Script fallback",

            )

        )



    raise RuntimeError(

        "Google Apps Script exceeded the redirect limit."

    )





# ============================================================

# COMMON GOOGLE FETCH

# ============================================================



def fetch_google_json(

    url,

    context,

    method="GET",

    payload=None,

):

    primary_errors = []



    for attempt in range(

        1,

        GOOGLE_REQUEST_RETRIES + 1,

    ):

        try:

            response_payload = (

                fetch_google_primary(

                    url,

                    method=method,

                    payload=payload,

                )

            )



            return (

                validate_google_payload(

                    response_payload,

                    context,

                )

            )



        except RuntimeError as exc:

            message = str(

                exc

            )



            if (

                should_fail_fast_google_error(

                    message

                )

            ):

                raise



            primary_errors.append(

                message

            )



        except Exception as exc:

            primary_errors.append(

                str(

                    exc

                )

            )



        if (

            attempt

            <

            GOOGLE_REQUEST_RETRIES

        ):

            delay_index = min(

                attempt - 1,

                len(

                    GOOGLE_RETRY_DELAYS

                ) - 1,

            )



            time.sleep(

                GOOGLE_RETRY_DELAYS[

                    delay_index

                ]

            )



    fallback_errors = []



    for attempt in range(

        1,

        GOOGLE_REQUEST_RETRIES + 1,

    ):

        try:

            response_payload = (

                fetch_google_fallback(

                    url,

                    method=method,

                    payload=payload,

                )

            )



            return (

                validate_google_payload(

                    response_payload,

                    context,

                )

            )



        except RuntimeError as exc:

            message = str(

                exc

            )



            if (

                should_fail_fast_google_error(

                    message

                )

            ):

                raise



            fallback_errors.append(

                message

            )



        except Exception as exc:

            fallback_errors.append(

                str(

                    exc

                )

            )



        if (

            attempt

            <

            GOOGLE_REQUEST_RETRIES

        ):

            delay_index = min(

                attempt - 1,

                len(

                    GOOGLE_RETRY_DELAYS

                ) - 1,

            )



            time.sleep(

                GOOGLE_RETRY_DELAYS[

                    delay_index

                ]

            )



    primary_message = (

        primary_errors[-1]

        if primary_errors

        else

        "Unknown primary connection error."

    )



    fallback_message = (

        fallback_errors[-1]

        if fallback_errors

        else

        "Unknown fallback connection error."

    )



    raise RuntimeError(

        f"{context} failed. "

        f"Primary connection: {primary_message} "

        f"Fallback connection: {fallback_message}"

    )





# ============================================================

# GENERIC GOOGLE ACTION HELPERS

# ============================================================



def get_google_action_data(

    action,

    context,

    parameters=None,

):

    base_url, sync_key = (

        get_google_settings()

    )



    url = (

        build_google_action_url(

            base_url,

            sync_key,

            action,

        )

    )



    if parameters:

        parsed = urlparse(url)



        query = dict(

            parse_qsl(

                parsed.query,

                keep_blank_values=True,

            )

        )



        for key, value in parameters.items():

            if value is None:

                continue



            query[str(key)] = str(value)



        url = urlunparse(

            (

                parsed.scheme,

                parsed.netloc,

                parsed.path,

                parsed.params,

                urlencode(query),

                parsed.fragment,

            )

        )



    return (

        fetch_google_json(

            url,

            context,

            method="GET",

        )

    )





def post_google_action_data(

    action,

    payload,

    context,

):

    base_url, sync_key = (

        get_google_settings()

    )



    url = (

        build_google_action_url(

            base_url,

            sync_key,

            action,

        )

    )



    return (

        fetch_google_json(

            url,

            context,

            method="POST",

            payload=

                payload or {},

        )

    )





# ============================================================

# GET GOOGLE INVENTORY

# ============================================================



def get_google_inventory_data():

    base_url, sync_key = (

        get_google_settings()

    )



    url = (

        build_google_inventory_url(

            base_url,

            sync_key,

        )

    )



    return (

        fetch_google_json(

            url,

            "Google inventory sync",

        )

    )





# ============================================================

# GET GOOGLE ADMIN DASHBOARD

# ============================================================



def get_google_admin_dashboard_data():

    base_url, sync_key = (

        get_google_settings()

    )



    url = (

        build_google_admin_dashboard_url(

            base_url,

            sync_key,

        )

    )



    return (

        fetch_google_json(

            url,

            "Google admin dashboard",

        )

    )





# ============================================================

# GOOGLE ADMIN POS PRODUCTS

# ============================================================



def get_google_admin_pos_products():

    base_url, sync_key = (

        get_google_settings()

    )



    url = (

        build_google_admin_pos_products_url(

            base_url,

            sync_key,

        )

    )



    return (

        fetch_google_json(

            url,

            "Google admin POS products",

        )

    )





# ============================================================

# GOOGLE ADMIN POS SALES

# ============================================================



def get_google_admin_pos_sales():

    base_url, sync_key = (

        get_google_settings()

    )



    url = (

        build_google_admin_pos_sales_url(

            base_url,

            sync_key,

        )

    )



    return (

        fetch_google_json(

            url,

            "Google admin POS sales",

        )

    )





# ============================================================

# GOOGLE ADMIN POS CHECKOUT

# ============================================================



def create_google_admin_pos_checkout(

    payload,

):

    if not isinstance(

        payload,

        dict,

    ):

        raise RuntimeError(

            "POS checkout payload must be an object."

        )



    base_url, sync_key = (

        get_google_settings()

    )



    url = (

        build_google_admin_pos_checkout_url(

            base_url,

            sync_key,

        )

    )



    return (

        fetch_google_json(

            url,

            "Google admin POS checkout",

            method="POST",

            payload=payload,

        )

    )





# ============================================================

# GOOGLE ADMIN ORDERS

# ============================================================



def get_google_admin_orders():

    return get_google_action_data(

        "admin-orders",

        "Google admin orders",

    )





def get_google_admin_order(

    order_id,

):

    clean_order_id = str(

        order_id or ""

    ).strip()



    if not clean_order_id:

        raise RuntimeError(

            "Order ID is required."

        )



    return get_google_action_data(

        "admin-order",

        "Google admin order",

        parameters={

            "order_id":

                clean_order_id,

        },

    )





def update_google_admin_order_status(

    order_id,

    status,

):

    clean_order_id = str(

        order_id or ""

    ).strip()



    clean_status = str(

        status or ""

    ).strip()



    if not clean_order_id:

        raise RuntimeError(

            "Order ID is required."

        )



    if not clean_status:

        raise RuntimeError(

            "Order status is required."

        )



    return post_google_action_data(

        "admin-order-status",

        {

            "order_id":

                clean_order_id,

            "status":

                clean_status,

        },

        "Google admin order status update",

    )





# ============================================================

# DATABASE INVENTORY SYNC

# ============================================================



def sync_inventory_from_google(

    db: Session,

):

    payload = (

        get_google_inventory_data()

    )



    drugs = payload.get(

        "drugs",

        [],

    )



    inventory = payload.get(

        "inventory",

        [],

    )



    if not isinstance(

        drugs,

        list,

    ):

        drugs = []



    if not isinstance(

        inventory,

        list,

    ):

        inventory = []



    drug_count = 0

    inventory_count = 0



    try:

        # ====================================================

        # DRUGS

        # ====================================================



        for item in drugs:

            if not isinstance(

                item,

                dict,

            ):

                continue



            drug_id = str(

                item.get(

                    "Drug_ID",

                    "",

                )

            ).strip()



            if not drug_id:

                continue



            drug = (

                db.query(

                    Drug

                )

                .filter(

                    Drug.drug_id

                    == drug_id

                )

                .first()

            )



            if drug is None:

                drug = Drug(

                    drug_id=

                        drug_id

                )



                db.add(

                    drug

                )



            drug.drug_name = str(

                item.get(

                    "Drug_Name",

                    "",

                )

            ).strip()



            drug.category = str(

                item.get(

                    "Category",

                    "",

                )

            ).strip()



            drug.cost_price = float(

                item.get(

                    "Cost_Price",

                    0,

                )

                or 0

            )



            drug.monthly_price = float(

                item.get(

                    "Monthly_Price",

                    0,

                )

                or 0

            )



            drug.one_time_price = float(

                item.get(

                    "One_Time_Price",

                    0,

                )

                or 0

            )



            drug.stock_quantity = int(

                float(

                    item.get(

                        "Stock_Quantity",

                        0,

                    )

                    or 0

                )

            )



            drug.reorder_level = int(

                float(

                    item.get(

                        "Reorder_Level",

                        0,

                    )

                    or 0

                )

            )



            drug_count += 1



        # ====================================================

        # INVENTORY

        # ====================================================



        for item in inventory:

            if not isinstance(

                item,

                dict,

            ):

                continue



            inventory_id = str(

                item.get(

                    "Inventory_ID",

                    "",

                )

            ).strip()



            if not inventory_id:

                continue



            inventory_item = (

                db.query(

                    InventoryItem

                )

                .filter(

                    InventoryItem.inventory_id

                    == inventory_id

                )

                .first()

            )



            if inventory_item is None:

                inventory_item = (

                    InventoryItem(

                        inventory_id=

                            inventory_id

                    )

                )



                db.add(

                    inventory_item

                )



            inventory_item.drug_id = str(

                item.get(

                    "Drug_ID",

                    "",

                )

            ).strip()



            inventory_item.drug_name = str(

                item.get(

                    "Drug_Name",

                    "",

                )

            ).strip()



            inventory_item.stock_quantity = int(

                float(

                    item.get(

                        "Stock_Quantity",

                        0,

                    )

                    or 0

                )

            )



            inventory_item.reorder_level = int(

                float(

                    item.get(

                        "Reorder_Level",

                        0,

                    )

                    or 0

                )

            )



            inventory_item.stock_status = str(

                item.get(

                    "Stock_Status",

                    "",

                )

            ).strip()



            inventory_item.last_updated = (

                parse_datetime(

                    item.get(

                        "Last_Updated"

                    )

                )

            )



            inventory_count += 1



        db.commit()



        return {

            "ok":

                True,

            "source":

                payload.get(

                    "source",

                    "google-sheets",

                ),

            "drugs_synced":

                drug_count,

            "inventory_synced":

                inventory_count,

        }



    except Exception:

        db.rollback()

        raise
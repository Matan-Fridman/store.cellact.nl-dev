import functions_framework
import os
import json
import stripe
from eth_account.messages import encode_defunct
import base64
from web3 import Web3
from google.cloud import firestore
from google.cloud import storage
from datetime import datetime
import uuid


db = firestore.Client()

@functions_framework.http
def hello_http(request):

    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600',
        }
        return '', 204, headers

    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    request_json = request.get_json(silent=True)
    request_args = request.args

    print(request_json)

    got_user_id = False

    if request_json and all(key in request_json for key in ['packageId', 'packageName', 'transactionPrice', 'subscriptionPrice', 'currency','success_url','failure_url']):
        package_id = request_json['packageId']
        package_name = request_json['packageName']
        transaction_price = int(float(request_json['transactionPrice']) * 100)
        subscription_price = int(float(request_json['subscriptionPrice']) * 100)
        currency = request_json['currency']
        success_url = request_json['success_url']
        failure_url = request_json['failure_url']

        # Optional — forwarded verbatim into Stripe session metadata so the
        # webhook adapter can route the event to the correct handler.
        # For service_provider packages: JSON string with full SP registration config.
        sp_config = request_json.get('sp_config', '')

        if 'userId' in request_json:
            print("userId.... what")
            user_id = request_json['userId']
            print("The user id is: ", user_id)
            got_user_id = True
        
        if 'user_address' in request_json:
            print("normal user address: ")
            user_id = request_json['user_address']
            print("The user id is: ", user_id)
            got_user_id = True
        
        else:
            user_id = os.urandom(16)
            user_id = user_id.hex()

    else:
        return {'error': 'Invalid request: Missing required fields'}, 400
 

    try:

        email = "before"
        if user_id == "nope" or package_name == "EMAIL":

            uuidEmail = request_json['uuidEmail']
            signedUUID = request_json['signedUUID']
            addressOfSigner = verify_signature(uuidEmail, signedUUID)
            print("address of signer: " + addressOfSigner )
            order_ref_email = db.collection('pre-verified').document(uuidEmail).get().to_dict()
            user_wallet = order_ref_email.get('wallet')
            print("address of firebase blabla is: " + user_wallet )

            if user_wallet != addressOfSigner:
                print("NOooooooooo")
                return "noooooo", 404, headers
            
            email = order_ref_email.get('email')
            user_id = user_wallet

        if 'isProd' in request_json and request_json['isProd']:
            stripe.api_key = os.environ.get('STRIPE_PROD_API_KEY')
        else:
            stripe.api_key = os.environ.get('STRIPE_API_KEY')

        customer = stripe.Customer.create(metadata={"userId": user_id})

        uuidForSuccess = str(uuid.uuid4())

        if got_user_id:
            failure_url = failure_url + "?user_address=" + str(user_id) 
            if 'landline' in request_json:
                failure_url = failure_url + "&landline=dkjasdkajds"

            success_url = (success_url + "?session_id=" + uuidForSuccess + "&user_address=" + str(user_id))
        else:
            success_url = (success_url + "?session_id=" + uuidForSuccess)

        # Build Stripe session metadata — package_type lets the webhook route
        # the event correctly (secnum_number vs service_provider).
        # sp_config is stored in Firestore (not Stripe) to avoid the 500-char limit.
        session_metadata = {
            'uuid': uuidForSuccess,
            'package_type': package_id,
        }

        # Create a new Checkout Session for the order
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            line_items=[
                {
                    # One-time fee item
                    'price_data': {
                        'currency': currency,
                        'product_data': {
                            'name': 'One-time setup fee',
                        },
                        'unit_amount': transaction_price,
                    },
                    'quantity': 1,
                },
                {
                    # Recurring subscription item
                    'price_data': {
                        'currency': currency,
                        'product_data': {
                            'name': package_name,
                        },
                        'recurring': {
                            'interval': 'month',
                        },
                        'unit_amount': subscription_price,
                    },
                    'quantity': 1,
                }
            ],
            mode='subscription',
            success_url=success_url,
            cancel_url=failure_url,
            metadata=session_metadata,
            allow_promotion_codes=True,
        )

        transaction_ts = datetime.utcnow().isoformat()

        order_ref = db.collection('orders').document(uuidForSuccess)

        add_fields = {
            'customer_id': customer.id
        }

        print("CustomerID: " + customer.id)

        subscription_price = float(subscription_price / 100)

        json_for_orders = {
            'package_name': package_name,
            'user_id': user_id,
            'package_id': package_id,
            'price': f"{subscription_price}{currency}",
            'status': 'Pending',
            'transaction_ts': transaction_ts,
            'customer_id': customer.id,
            'additonal_fields': json.dumps(add_fields)
        }

        if package_name == "EMAIL":
            json_for_orders['email'] = email

        # Store sp_config in Firestore so the worker can read it without relying
        # on Stripe metadata (which has a 500-char value limit).
        if sp_config:
            json_for_orders['sp_config'] = sp_config

        order_ref.set(json_for_orders)
        
        data = json.dumps({"url": checkout_session.url})
 
        return data, 200, headers

    except Exception as e:
        print(str(e))
        return str(e), 400



def decompressNGetAddress(uuidEmail, signedUUID):
    bytes_data = base64.b64decode(signedUUID)
    sign = bytes_data.hex()
    print("Hex String:", sign) 
    return verify_signature(uuidEmail, sign) 


def verify_signature(message, signature):
    w3 = Web3()
    message_encoded = encode_defunct(text=message)
    try:
        recovered_signer = w3.eth.account.recover_message(message_encoded, signature=signature)
        return recovered_signer
    except Exception as e:
        print(f"An error occurred: {e}")
        return "404"

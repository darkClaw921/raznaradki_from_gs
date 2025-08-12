import requests
import json

# URL вебхука
webhook_url = "https://dmd-cottage.alteran-industries.ru/api/webhook/89833d5b-cbdd-4187-a2e2-5653387c41ab"
00)  29
# Данные для отправки
data = {
    "action": "update_booking",
    "status": "booked",
    "data": {
        "booking": {
            "id": 115344589,
            "begin_date": "2025-07-26",
            "end_date": "2025-07-27",
            "realty_id": 121984,
            "user_id": 23736,
            "created_at": "2025-06-30T16:04:56.658+03:00",
            "updated_at": "2025-07-22T18:29:26.381+03:00",
            "status_cd": 5,
            "booking_id": None,
            "amount": 37000,
            "is_delete": False,
            "notes": "Оплатит бронь 04 июля !!!\n37к/18п (4.07 11:51) доплата 19.000 до 16 чел.",
            "color": None,
            "contacts": None,
            "source": "manual",
            "days": None,
            "realty_room_id": None,
            "max_days": None,
            "closed_on_arrivial": False,
            "closed_on_departure": False,
            "rate_ids": None,
            "single_use_amount": None,
            "closed": False,
            "min_stay_through": None,
            "max_stay_through": None,
            "ostrovok_rate_ids": None,
            "ostrovok_occupancy_ids": None,
            "booking_origin_id": None,
            "oktogo_rate_ids": None,
            "arrival_time": None,
            "departure_time": None,
            "prepayment": 18000,
            "client_id": 29820988,
            "deposit": 0,
            "is_send_confirm_email": False,
            "payment": 18000,
            "use_rates_restrictions": False,
            "expedia_rate_ids": None,
            "special_price_id": None,
            "is_hidden": False,
            "bronevik_rate_ids": None,
            "agency_id": 16123,
            "reaction": None,
            "sync_at": "2025-07-22T18:29:26.534+03:00",
            "preparing": False,
            "partner": None,
            "partner_uid": None,
            "partner_guests_count": None,
            "platform_tax": None,
            "platform_tax_currency": None,
            "hotels_101_rate_ids": None,
            "automessages_enabled": False,
            "uuid": "9ca8832d-3afa-4144-bca1-2992223b1acb",
            "secure_id": "dtwAm9BSBz",
            "booked_date": "2025-06-30",
            "canceled_date": None,
            "deleted_date": None,
            "client": {
                "id": 29820988,
                "fio": "Ангелина",
                "email": "",
                "phone": "+7 977 168-48-66",
                "additional_phone": None,
                "created_at": "2024-10-20T12:32:19.271+03:00",
                "updated_at": "2025-07-04T12:04:53.368+03:00",
                "swindler_id": None,
                "contact_text": "Ангелина\nзабронировал 29-01 сент., 00)  29\n71000/сут",
                "modified_at": "2025-04-25T11:32:40.091+03:00",
                "contact_text_for_ios": "29-01 сент.; 00)  29; Ангелина; 71000",
                "agency_id": 16123,
                "last_numbers": None
            },
            "payments_with_deleted": [
                {
                    "id": 25732174,
                    "rent_id": 115344589,
                    "rent_payment_invoice_id": 63252,
                    "user_id": 23736,
                    "amount": 18000,
                    "is_approved": False,
                    "note": "аванс",
                    "created_at": "2025-07-04T12:04:48.922+03:00",
                    "updated_at": "2025-07-04T12:04:48.922+03:00",
                    "timezone": "Europe/Moscow",
                    "paid_at": "2025-07-04T12:04:48.922+03:00",
                    "paymentable_type": None,
                    "paymentable_id": None,
                    "refunded": None,
                    "type": "payment",
                    "payment_type": "income",
                    "email": None,
                    "parent_payment_id": None,
                    "payment_system": "manual",
                    "paid_user_id": None,
                    "is_delete": False,
                    "refund_data": None,
                    "refund_started_at": None,
                    "moneta_payment_state": None,
                    "creation_origin": "internal",
                    "moneta_transaction_id": None,
                    "uuid": "02781a37-6e7d-4e5b-bdf8-73f13fed6558",
                    "secure_id": "G3tdHwfQLR",
                    "payment_link": None
                }
            ],
            "url": "https://realtycalendar.ru/event_calendars/115344589",
            "price_per_day": 37000,
            "apartment": {
                "id": 121984,
                "title": "00)  29"
            },
            "booking_origin": {
                "id": None,
                "title": None
            },
            "rent_payment_invoices": [
                {
                    "id": 178004,
                    "name": "Ostrovok"
                },
                {
                    "id": 152838,
                    "name": "Отелло"
                },
                {
                    "id": 140345,
                    "name": "cian.ru"
                },
                {
                    "id": 114667,
                    "name": "СБП 79672407772"
                },
                {
                    "id": 80710,
                    "name": "Авито"
                },
                {
                    "id": 67990,
                    "name": "СБП 79162343125"
                },
                {
                    "id": 63252,
                    "name": "Перевод"
                },
                {
                    "id": 61451,
                    "name": "Суточно"
                },
                {
                    "id": 53047,
                    "name": "Монета"
                },
                {
                    "id": 52213,
                    "name": "счет"
                },
                {
                    "id": 44891,
                    "name": "Наличные"
                },
                {
                    "id": 42810,
                    "name": "Карта"
                },
                {
                    "id": 27433,
                    "name": "Твил"
                }
            ],
            "deposit_payment_links": [],
            "payment_links": [],
            "number_of_days": 2,
            "number_of_nights": 1,
            "balance_to_be_paid_1": 19000,
            "balance_to_be_paid_2": 19000,
            "address": "деревня Бяконтово, ул.Хуторская, д. 29"
        },
        "changes": {
            "event_calendar": {
                "notes": [
                    "Оплатит бронь 04 июля !!!\n37к/18п (4.07 11:51) доплата 19.000 до 16 чел",
                    "Оплатит бронь 04 июля !!!\n37к/18п (4.07 11:51) доплата 19.000 до 16 чел."
                ],
                "sync_at": [
                    None,
                    "2025-07-22T18:29:26.534+03:00"
                ]
            },
            "client": {
                "additional_phone": [
                    "",
                    None
                ]
            },
            "event_calendar_payments": [
                {
                    "25732174": {
                        "rent_id": 115344589,
                        "rent_payment_invoice_id": 63252,
                        "user_id": 23736,
                        "amount": 18000,
                        "is_approved": False,
                        "note": "аванс",
                        "timezone": "Europe/Moscow",
                        "paid_at": "2025-07-04T12:04:48.922+03:00",
                        "paymentable_type": None,
                        "paymentable_id": None,
                        "refunded": None,
                        "type": "payment",
                        "payment_type": "income",
                        "email": None,
                        "parent_payment_id": None,
                        "payment_system": "manual",
                        "paid_user_id": None,
                        "is_delete": False,
                        "refund_data": None,
                        "refund_started_at": None,
                        "moneta_payment_state": None,
                        "creation_origin": "internal",
                        "moneta_transaction_id": None,
                        "uuid": None,
                        "secure_id": "G3tdHwfQLR"
                    }
                }
            ]
        },
        "crm_entity_id": None,
        "bitrix_lead_id": None
    }
}

# Отправка POST-запроса с JSON-данными
response = requests.post(webhook_url, json=data)

# Проверка статуса ответа
if response.status_code == 200:
    print("Данные успешно отправлены!")
else:
    print(f"Ошибка при отправке данных: {response.status_code} - {response.text}")
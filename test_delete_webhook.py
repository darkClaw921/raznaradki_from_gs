#!/usr/bin/env python3
"""
Тестовый скрипт для проверки webhook удаления бронирования
"""

import requests
import json

# Конфигурация
WEBHOOK_URL = "http://localhost:3001/api/webhook/e9518a9e-0c09-4e60-8f77-0f4f2db43636"
DELETE_BOOKING_DATA = {
    "action": "delete_booking",
    "status": "deleted",
    "data": {
        "booking": {
            "id": 122913631,
            "begin_date": "2025-10-13",
            "end_date": "2025-10-14",
            "realty_id": 121984,
            "user_id": 23736,
            "created_at": "2025-08-26T20:30:14.432+03:00",
            "updated_at": "2025-08-26T20:31:18.152+03:00",
            "status_cd": 5,
            "booking_id": None,
            "amount": 10000,
            "is_delete": True,
            "notes": None,
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
            "prepayment": 0,
            "client_id": 38129980,
            "deposit": None,
            "is_send_confirm_email": False,
            "payment": 0,
            "use_rates_restrictions": False,
            "expedia_rate_ids": None,
            "special_price_id": None,
            "is_hidden": False,
            "bronevik_rate_ids": None,
            "agency_id": 16123,
            "reaction": None,
            "sync_at": "2025-08-26T20:31:18.152+03:00",
            "preparing": False,
            "partner": None,
            "partner_uid": None,
            "partner_guests_count": None,
            "platform_tax": None,
            "platform_tax_currency": None,
            "hotels_101_rate_ids": None,
            "automessages_enabled": False,
            "uuid": "59d11b79-fdec-4330-b2a4-ecb93fb9cf83",
            "secure_id": "",
            "booked_date": "2025-08-26",
            "canceled_date": None,
            "deleted_date": "2025-08-26",
            "client": {
                "id": 38129980,
                "fio": "ТЕСТ 26",
                "email": None,
                "phone": None,
                "additional_phone": None,
                "created_at": "2025-08-26T20:30:26.340+03:00",
                "updated_at": "2025-08-26T20:31:21.598+03:00",
                "swindler_id": None,
                "contact_text": "ТЕСТ 26\n(отмена) забронировал 13-14 окт., 00)  29\n10000/сут",
                "modified_at": "2025-08-26T20:31:18.152+03:00",
                "contact_text_for_ios": "🔘 13-14 окт.; 00)  29; ТЕСТ 26; 10000; отмена",
                "agency_id": 16123,
                "last_numbers": None
            },
            "event_calendar_payments": [],
            "url": "https://realtycalendar.ru/event_calendars/122913631"
        },
        "crm_entity_id": None,
        "bitrix_lead_id": None
    },
    "executionMode": "test"
}

def test_delete_webhook():
    """Тестирует webhook удаления бронирования"""
    
    print("🧪 Тестирование webhook удаления бронирования")
    print(f"📡 URL: {WEBHOOK_URL}")
    print(f"📋 Данные: {json.dumps(DELETE_BOOKING_DATA, indent=2, ensure_ascii=False)}")
    
    try:
        # Отправляем POST запрос
        response = requests.post(
            WEBHOOK_URL,
            json=DELETE_BOOKING_DATA,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"\n📊 Результат:")
        print(f"   Статус: {response.status_code}")
        print(f"   Заголовки: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                print(f"   Ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
            except json.JSONDecodeError:
                print(f"   Ответ (текст): {response.text}")
        else:
            print(f"   Ошибка: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка запроса: {e}")
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")

if __name__ == "__main__":
    test_delete_webhook()

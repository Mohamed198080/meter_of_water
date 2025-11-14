// تطبيق نظام إدارة العدادات - JavaScript
let currentLocation = null;
let locationWatchId = null;

// الحصول على الموقع الحالي بدقة عالية
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showResult('المتصفح لا يدعم خدمة الموقع', 'error');
        return;
    }

    document.getElementById('location-status').innerHTML = `
        <strong>جاري الحصول على الموقع...</strong><br>
        <em>يتم الآن تحسين دقة الموقع، قد يستغرق بضع ثواني</em>
    `;
    document.getElementById('location-status').style.background = '#fff3cd';

    // إيقاف أي عملية سابقة
    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
    }

    let bestAccuracy = Infinity;
    let bestPosition = null;
    let attempts = 0;
    const maxAttempts = 10; // أقصى عدد من المحاولات

    locationWatchId = navigator.geolocation.watchPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            const altitude = position.coords.altitude;
            const altitudeAccuracy = position.coords.altitudeAccuracy;
            
            attempts++;
            
            console.log(`محاولة ${attempts}: الدقة = ${accuracy} متر`);

            // تحديث أفضل نتيجة
            if (accuracy < bestAccuracy) {
                bestAccuracy = accuracy;
                bestPosition = position;
                
                // تحديث الحقول مباشرة
                document.getElementById('latitude').value = lat.toFixed(8);
                document.getElementById('longitude').value = lng.toFixed(8);
                
                // تحديث حالة الموقع
                updateLocationStatus(position, attempts);
            }

            // التوقف إذا وصلنا لدقة ممتازة أو تجاوزنا عدد المحاولات
            if (accuracy <= 10 || attempts >= maxAttempts) {
                navigator.geolocation.clearWatch(locationWatchId);
                locationWatchId = null;
                
                if (bestPosition) {
                    finalizeLocation(bestPosition);
                }
            }
        },
        function(error) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
            
            let errorMessage = 'فشل في الحصول على الموقع: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'تم رفض الإذن. يرجى السماح بالوصول إلى الموقع';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'معلومات الموقع غير متاحة';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'انتهت مهلة طلب الموقع';
                    break;
                default:
                    errorMessage += 'خطأ غير معروف';
            }
            
            document.getElementById('location-status').innerHTML = `<strong>${errorMessage}</strong>`;
            document.getElementById('location-status').style.background = '#f8d7da';
            showResult(errorMessage, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        }
    );

    // إيقاف تلقائي بعد 30 ثانية كحد أقصى
    setTimeout(() => {
        if (locationWatchId) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
            if (bestPosition) {
                finalizeLocation(bestPosition);
            } else {
                document.getElementById('location-status').innerHTML = `
                    <strong>انتهت مهلة الحصول على الموقع</strong><br>
                    <em>جرب مرة أخرى في مكان مفتوح</em>
                `;
                document.getElementById('location-status').style.background = '#f8d7da';
            }
        }
    }, 30000);
}

// تحديث حالة الموقع أثناء المحاولات
function updateLocationStatus(position, attempts) {
    const accuracy = position.coords.accuracy;
    let accuracyClass = 'accuracy-low';
    let accuracyText = 'منخفضة';
    
    if (accuracy <= 10) {
        accuracyClass = 'accuracy-high';
        accuracyText = 'عالية جداً';
    } else if (accuracy <= 25) {
        accuracyClass = 'accuracy-medium';
        accuracyText = 'جيدة';
    }
    
    document.getElementById('location-status').innerHTML = `
        <strong>جاري تحسين الدقة... (${attempts})</strong><br>
        <strong>الدقة الحالية:</strong> <span class="accuracy-indicator ${accuracyClass}">${accuracy.toFixed(1)} متر (${accuracyText})</span><br>
        <em>استمر في الانتظار للحصول على أفضل دقة</em>
    `;
    document.getElementById('location-status').style.background = '#fff3cd';
}

// إنهاء عملية الحصول على الموقع
function finalizeLocation(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    currentLocation = { lat, lng, accuracy };
    
    let accuracyClass = 'accuracy-low';
    let accuracyText = 'منخفضة';
    
    if (accuracy <= 10) {
        accuracyClass = 'accuracy-high';
        accuracyText = 'عالية جداً';
    } else if (accuracy <= 25) {
        accuracyClass = 'accuracy-medium';
        accuracyText = 'جيدة';
    }
    
    document.getElementById('location-status').innerHTML = `
        <strong>تم الحصول على الموقع بنجاح!</strong><br>
        <strong>خط العرض:</strong> ${lat.toFixed(8)}<br>
        <strong>خط الطول:</strong> ${lng.toFixed(8)}<br>
        <strong>الدقة:</strong> <span class="accuracy-indicator ${accuracyClass}">${accuracy.toFixed(1)} متر (${accuracyText})</span>
    `;
    document.getElementById('location-status').style.background = '#d4edda';
    
    if (accuracy <= 10) {
        showResult('📍 تم الحصول على الموقع بدقة عالية جداً (أقل من 10 أمتار)', 'success');
    } else if (accuracy <= 25) {
        showResult('📍 تم الحصول على الموقع بدقة جيدة', 'success');
    } else {
        showResult('⚠️ تم الحصول على الموقع ولكن الدقة منخفضة. جرب في مكان مفتوح', 'error');
    }
}

// مسح الإحداثيات
function clearLocation() {
    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
    
    currentLocation = null;
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    document.getElementById('location-status').textContent = 'لم يتم الحصول على الموقع بعد';
    document.getElementById('location-status').style.background = '#e9ecef';
    showResult('تم مسح الإحداثيات', 'success');
}

// التحقق من صحة البيانات
function validateForm() {
    const requiredFields = [
        'meterNumber', 'meterType', 'meterBrand', 'valveType', 'valveCondition',
        'boxCondition', 'pieceNumber', 'propertyType', 'propertyCondition',
        'hasEncroachment', 'districtName', 'electricMetersCount', 
        'latitude', 'longitude', 'technicianName'
    ];
    
    let missingFields = [];
    requiredFields.forEach(field => {
        const value = document.getElementById(field).value.trim();
        if (!value) {
            missingFields.push(field);
        }
    });
    
    if (missingFields.length > 0) {
        showResult(`❌ يرجى ملء جميع الحقول المطلوبة`, 'error');
        return false;
    }
    
    // التحقق من الموقع
    if (!currentLocation) {
        showResult('❌ يرجى الحصول على الموقع أولاً', 'error');
        return false;
    }
    
    // التحقق من دقة الموقع
    if (currentLocation.accuracy > 50) {
        showResult('⚠️ دقة الموقع منخفضة. يرجى الحصول على موقع بدقة أعلى', 'error');
        return false;
    }
    
    return true;
}

// إرسال جميع البيانات
async function submitAllData() {
    try {
        if (!validateForm()) {
            return;
        }
        
        showResult('جاري حفظ البيانات...', 'success');
        
        // تجميع البيانات
        const formData = {
            meterNumber: document.getElementById('meterNumber').value,
            meterType: document.getElementById('meterType').value,
            meterBrand: document.getElementById('meterBrand').value,
            valveType: document.getElementById('valveType').value,
            valveCondition: document.getElementById('valveCondition').value,
            boxCondition: document.getElementById('boxCondition').value,
            pieceNumber: document.getElementById('pieceNumber').value,
            propertyType: document.getElementById('propertyType').value,
            propertyCondition: document.getElementById('propertyCondition').value,
            hasEncroachment: document.getElementById('hasEncroachment').value,
            districtName: document.getElementById('districtName').value,
            electricMetersCount: document.getElementById('electricMetersCount').value,
            latitude: document.getElementById('latitude').value,
            longitude: document.getElementById('longitude').value,
            technicianName: document.getElementById('technicianName').value,
            notes: document.getElementById('notes').value,
            locationAccuracy: currentLocation.accuracy.toFixed(1)
        };
        
        console.log('بيانات المرسلة:', formData);
        
        // رابط Google Apps Script - تأكد من استبداله برابطك
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzaA2IEJQFz5J8L6XldSB7XHO_DW13uI2ppgkAo9jvk7fRUaJG-uLYT4x0hQtDi5xF2/exec';
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showResult(`✅ تم حفظ جميع البيانات بنجاح في Google Sheets. الرقم التسلسلي: ${result.data.serialNumber}`, 'success');
            clearAllData();
        } else {
            showResult('❌ خطأ في حفظ البيانات: ' + (result.message || 'غير معروف'), 'error');
        }
        
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        showResult('❌ خطأ في إرسال البيانات: ' + error.message, 'error');
    }
}

// مسح جميع البيانات
function clearAllData() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
        // مسح الحقول
        document.getElementById('main-form').reset();
        
        // مسح الموقع
        clearLocation();
        
        showResult('تم مسح جميع البيانات', 'success');
    }
}

// عرض رسائل النتيجة
function showResult(message, type) {
    const resultDiv = document.getElementById('result-message');
    resultDiv.innerHTML = `<div class="result ${type}">${message}</div>`;
    
    setTimeout(() => {
        resultDiv.innerHTML = '';
    }, 5000);
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل تطبيق إدارة العدادات بنجاح');
    
    // إضافة تنبيه لأهمية الموقع
    setTimeout(() => {
        showResult('📍 يرجى الحصول على الموقع أولاً لأهميته في تسجيل البيانات', 'success');
    }, 2000);
    
    // إضافة تحقق عند مغادرة الصفحة
    window.addEventListener('beforeunload', function(e) {
        if (document.getElementById('meterNumber').value) {
            e.preventDefault();
            e.returnValue = 'هل تريد مغادرة الصفحة؟ قد تفقد البيانات غير المحفوظة.';
        }
    });
});

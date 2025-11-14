// تطبيق نظام إدارة العدادات - JavaScript (مصحح)
let currentLocation = null;
let locationWatchId = null;

// إعدادات التطبيق
const APP_CONFIG = {
    // استبدل هذا الرابط برابط Google Apps Script الخاص بك بعد النشر
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwIfosZPBkKlKQI7k_kVYapFqzL4dIA3V5Lh-OE4Wf6Qe7yih6ilJNVPaR54Yh_gpUp/exec',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000
};

// الحصول على الموقع الحالي بدقة عالية
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showResult('المتصفح لا يدعم خدمة الموقع', 'error');
        return;
    }

    const locationBtn = document.getElementById('location-btn');
    locationBtn.disabled = true;
    locationBtn.innerHTML = '⏳ جاري الحصول على الموقع...';

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
    const maxAttempts = 15;

    locationWatchId = navigator.geolocation.watchPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
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
                
                locationBtn.disabled = false;
                locationBtn.innerHTML = '📍 الحصول على الموقع الحالي';
            }
        },
        function(error) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
            
            let errorMessage = 'فشل في الحصول على الموقع: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'تم رفض الإذن. يرجى السماح بالوصول إلى الموقع في إعدادات المتصفح';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'معلومات الموقع غير متاحة. تأكد من تشغيل GPS';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'انتهت مهلة طلب الموقع. جرب مرة أخرى';
                    break;
                default:
                    errorMessage += 'خطأ غير معروف';
            }
            
            document.getElementById('location-status').innerHTML = `<strong>${errorMessage}</strong>`;
            document.getElementById('location-status').style.background = '#f8d7da';
            showResult(errorMessage, 'error');
            
            locationBtn.disabled = false;
            locationBtn.innerHTML = '📍 الحصول على الموقع الحالي';
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        }
    );

    // إيقاف تلقائي بعد 45 ثانية كحد أقصى
    setTimeout(() => {
        if (locationWatchId) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
            if (bestPosition) {
                finalizeLocation(bestPosition);
            } else {
                document.getElementById('location-status').innerHTML = `
                    <strong>انتهت مهلة الحصول على الموقع</strong><br>
                    <em>جرب مرة أخرى في مكان مفتوح مع تشغيل GPS</em>
                `;
                document.getElementById('location-status').style.background = '#f8d7da';
            }
            locationBtn.disabled = false;
            locationBtn.innerHTML = '📍 الحصول على الموقع الحالي';
        }
    }, 45000);
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
    let messageType = 'error';
    
    if (accuracy <= 10) {
        accuracyClass = 'accuracy-high';
        accuracyText = 'عالية جداً';
        messageType = 'success';
    } else if (accuracy <= 25) {
        accuracyClass = 'accuracy-medium';
        accuracyText = 'جيدة';
        messageType = 'success';
    } else {
        messageType = 'warning';
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
        showResult('⚠️ تم الحصول على الموقع ولكن الدقة منخفضة. جرب في مكان مفتوح', 'warning');
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
            // الحصول على نص label للحقل
            const label = document.querySelector(`label[for="${field}"]`).textContent.replace(' *', '');
            missingFields.push(label);
        }
    });
    
    if (missingFields.length > 0) {
        showResult(`❌ يرجى ملء الحقول التالية: ${missingFields.join(', ')}`, 'error');
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

// إرسال البيانات مع إعادة المحاولة
async function submitAllData() {
    try {
        if (!validateForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> جاري الحفظ...';
        
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
            locationAccuracy: currentLocation.accuracy.toFixed(1),
            timestamp: new Date().toISOString()
        };
        
        console.log('بيانات المرسلة:', formData);
        
        // محاولة الإرسال مع إعادة المحاولة
        const result = await sendDataWithRetry(formData);
        
        if (result.success) {
            showResult(`✅ تم حفظ جميع البيانات بنجاح! الرقم التسلسلي: ${result.data.serialNumber}`, 'success');
            clearAllData();
        } else {
            showResult(`❌ فشل في حفظ البيانات: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('خطأ غير متوقع:', error);
        showResult('❌ حدث خطأ غير متوقع: ' + error.message, 'error');
    } finally {
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 حفظ جميع البيانات';
    }
}

// إرسال البيانات مع إعادة المحاولة
async function sendDataWithRetry(formData, retryCount = 0) {
    try {
        // استخدام طريقة مختلفة للإرسال لتجنب مشاكل CORS
        const response = await fetch(APP_CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            return {
                success: true,
                data: result.data
            };
        } else {
            throw new Error(result.message || 'خطأ غير معروف من الخادم');
        }
        
    } catch (error) {
        console.error(`محاولة ${retryCount + 1} فشلت:`, error);
        
        if (retryCount < APP_CONFIG.MAX_RETRIES) {
            showResult(`🔄 إعادة المحاولة ${retryCount + 1} من ${APP_CONFIG.MAX_RETRIES}...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, APP_CONFIG.RETRY_DELAY));
            return sendDataWithRetry(formData, retryCount + 1);
        } else {
            return {
                success: false,
                error: error.message
            };
        }
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
    
    // إبقاء الرسالة لفترة أطول إذا كانت خطأ
    const duration = type === 'error' ? 8000 : 5000;
    
    setTimeout(() => {
        if (resultDiv.innerHTML.includes(message)) {
            resultDiv.innerHTML = '';
        }
    }, duration);
}

// اختبار اتصال Google Apps Script
async function testConnection() {
    try {
        showResult('🔍 جاري اختبار الاتصال...', 'warning');
        
        const testData = {
            test: true,
            meterNumber: 'TEST-' + Date.now(),
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(APP_CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showResult('✅ الاتصال يعمل بشكل صحيح', 'success');
            return true;
        } else {
            showResult('❌ مشكلة في الخادم: ' + result.message, 'error');
            return false;
        }
        
    } catch (error) {
        showResult('❌ فشل اختبار الاتصال: ' + error.message, 'error');
        return false;
    }
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
        const hasData = document.getElementById('meterNumber').value || 
                       document.getElementById('technicianName').value;
        if (hasData) {
            e.preventDefault();
            e.returnValue = 'هل تريد مغادرة الصفحة؟ قد تفقد البيانات غير المحفوظة.';
        }
    });
    
    // اختبار الاتصال تلقائياً
    setTimeout(() => {
        testConnection();
    }, 3000);
});

// إضافة زر اختبار الاتصال يدوياً (لأغراض التصحيح)
function addTestButton() {
    const testBtn = document.createElement('button');
    testBtn.innerHTML = '🔧 اختبار الاتصال';
    testBtn.onclick = testConnection;
    testBtn.style.background = '#ffc107';
    testBtn.style.color = '#212529';
    document.querySelector('.form-section:last-child').appendChild(testBtn);
}

// تفعيل زر الاختبار في وضع التطوير
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', addTestButton);
}

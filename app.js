// تطبيق JavaScript الرئيسي المحسن - بدون مسح الباركود
let currentWatchId = null;

// الحصول على الموقع الجغرافي بدقة عالية
function getCurrentLocation() {
    const locationInfo = document.getElementById('location-info');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const accuracyInput = document.getElementById('location-accuracy');
    
    if (!navigator.geolocation) {
        showResult('المتصفح لا يدعم خدمة تحديد الموقع', 'error');
        return;
    }
    
    locationInfo.style.display = 'block';
    locationInfo.textContent = 'جاري تحديد الموقع...';
    locationInfo.style.background = '#fff3cd';
    
    const options = {
        enableHighAccuracy: true, // دقة عالية
        timeout: 30000, // 30 ثانية
        maximumAge: 0 // لا نريد بيانات قديمة
    };
    
    // إيقاف أي عملية تحديد موقع سابقة
    if (currentWatchId) {
        navigator.geolocation.clearWatch(currentWatchId);
    }
    
    currentWatchId = navigator.geolocation.watchPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            latitudeInput.value = lat.toFixed(8);
            longitudeInput.value = lng.toFixed(8);
            accuracyInput.value = accuracy.toFixed(2);
            
            locationInfo.textContent = `✅ تم تحديد الموقع بدقة ${accuracy.toFixed(2)} متر`;
            locationInfo.style.background = '#d4edda';
            
            showResult(`✅ تم الحصول على الموقع بدقة ${accuracy.toFixed(2)} متر`, 'success');
            
            // إيقاف المتابعة بعد الحصول على موقع دقيق
            if (accuracy <= 10) {
                navigator.geolocation.clearWatch(currentWatchId);
                currentWatchId = null;
                locationInfo.textContent += ' - ✅ دقة ممتازة';
            }
        },
        function(error) {
            let errorMessage = 'خطأ في تحديد الموقع: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'تم رفض الإذن لتحديد الموقع';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'معلومات الموقع غير متاحة';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'انتهت المهلة في انتظار الموقع';
                    break;
                default:
                    errorMessage += 'خطأ غير معروف';
            }
            
            locationInfo.textContent = errorMessage;
            locationInfo.style.background = '#f8d7da';
            showResult(errorMessage, 'error');
        },
        options
    );
}

// إرسال البيانات إلى Google Sheets
async function submitData() {
    // جمع البيانات من جميع الحقول
    const formData = collectFormData();
    
    // التحقق من الحقول الإلزامية
    if (!formData.meterNumber) {
        showResult('يرجى إدخال رقم العداد', 'error');
        document.getElementById('meter-number').focus();
        return;
    }
    
    if (!formData.technicianName) {
        showResult('يرجى إدخال اسم الفني', 'error');
        document.getElementById('technician-name').focus();
        return;
    }
    
    try {
        showResult('جاري حفظ البيانات...', 'success');
        
        // رابط Google Apps Script - استبدله برابطك
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhQvkgWRxW1KStoMQXRadlxLLKMmlBNTp5Ug19UZuoSkKTqbT0xHPYRgssnF0ZPSCi/exec';
        
        console.log('إرسال البيانات:', formData);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        showResult('✅ تم إرسال البيانات بنجاح', 'success');
        clearForm();
        
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        showResult('❌ خطأ في إرسال البيانات: ' + error.message, 'error');
    }
}

// جمع البيانات من النموذج
function collectFormData() {
    return {
        meterNumber: document.getElementById('meter-number').value.trim(),
        technicianName: document.getElementById('technician-name').value.trim(),
        meterType: document.getElementById('meter-type').value,
        meterBrand: document.getElementById('meter-brand').value,
        valveType: document.getElementById('valve-type').value,
        valveStatus: document.getElementById('valve-status').value,
        boxStatus: document.getElementById('box-status').value,
        plotNumber: document.getElementById('plot-number').value.trim(),
        propertyType: document.getElementById('property-type').value,
        propertyStatus: document.getElementById('property-status').value,
        district: document.getElementById('district').value.trim(),
        electricMetersCount: document.getElementById('electric-meters-count').value,
        encroachment: document.getElementById('encroachment').checked ? 'نعم' : 'لا',
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value,
        locationAccuracy: document.getElementById('location-accuracy').value,
        notes: document.getElementById('notes').value.trim(),
        inputMethod: 'إدخال يدوي',
        timestamp: new Date().toISOString()
    };
}

// مسح النموذج
function clearForm() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else if (input.type === 'number') {
            input.value = '';
        } else {
            input.value = '';
        }
    });
    
    document.getElementById('location-info').style.display = 'none';
    
    showResult('تم مسح النموذج بنجاح', 'success');
}

// عرض رسائل النتيجة
function showResult(message, type) {
    const resultDiv = document.getElementById('result-message');
    resultDiv.innerHTML = `<div class="result ${type}">${message}</div>`;
    
    setTimeout(() => {
        resultDiv.innerHTML = '';
    }, 5000);
}

// فتح console لأغراض التصحيح
function openDebugConsole() {
    console.log('=== بدء التصحيح ===');
    console.log('المتصفح:', navigator.userAgent);
    console.log('يدعم الموقع:', !!navigator.geolocation);
    console.log('الرابط:', window.location.href);
}

// التحقق من صحة النموذج قبل الإرسال
function validateForm() {
    const meterNumber = document.getElementById('meter-number').value.trim();
    const technicianName = document.getElementById('technician-name').value.trim();
    
    if (!meterNumber) {
        showResult('يرجى إدخال رقم العداد', 'error');
        return false;
    }
    
    if (!technicianName) {
        showResult('يرجى إدخال اسم الفني', 'error');
        return false;
    }
    
    return true;
}

// إضافة مستمعين للأحداث لتحسين تجربة المستخدم
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل التطبيق بنجاح');
    openDebugConsole();
    
    // إضافة التحقق أثناء الكتابة للحقول الإلزامية
    const requiredFields = document.querySelectorAll('input[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    });
    
    // إمكانية استخدام زر Enter للإرسال
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const focused = document.activeElement;
            if (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA') {
                e.preventDefault();
                submitData();
            }
        }
    });
});

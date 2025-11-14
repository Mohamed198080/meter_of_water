// تطبيق JavaScript الرئيسي المحسن
let html5QrcodeScanner = null;
let isScanning = false;
let currentWatchId = null;

// تبديل التبويبات
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    if (isScanning) {
        stopBarcodeScanner();
    }
}

// بدء مسح الباركود
async function startBarcodeScanner() {
    try {
        if (isScanning) {
            showResult('الماسح يعمل بالفعل!', 'error');
            return;
        }

        document.getElementById('camera-status').textContent = 'جاري تهيئة الكاميرا...';
        document.getElementById('camera-status').style.background = '#fff3cd';
        
        // تحميل المكتبة ديناميكياً إذا لم تكن موجودة
        if (typeof Html5Qrcode === 'undefined') {
            await loadHtml5QrcodeLibrary();
        }

        // إنشاء ماسح جديد
        html5QrcodeScanner = new Html5Qrcode("reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            rememberLastUsedCamera: true
        };

        console.log('جاري تشغيل الكاميرا...');
        
        // بدء المسح
        await html5QrcodeScanner.start(
            { facingMode: "environment" }, 
            config,
            onScanSuccess,
            onScanFailure
        ).then(() => {
            isScanning = true;
            document.getElementById('camera-status').textContent = 'الماسح نشط - وجّه الكاميرا نحو الباركود';
            document.getElementById('camera-status').style.background = '#d4edda';
            console.log('تم تشغيل الكاميرا بنجاح');
        });
        
    } catch (error) {
        console.error('خطأ في تشغيل الماسح:', error);
        handleCameraError(error);
    }
}

// تحميل المكتبة ديناميكياً
function loadHtml5QrcodeLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof Html5Qrcode !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('فشل تحميل مكتبة مسح الباركود'));
        document.head.appendChild(script);
    });
}

// معالجة أخطاء الكاميرا
function handleCameraError(error) {
    let errorMessage = 'خطأ في تشغيل الكاميرا: ';
    
    if (error.message.includes('NotAllowedError')) {
        errorMessage += 'تم رفض الإذن. يرجى السماح باستخدام الكاميرا';
    } else if (error.message.includes('NotFoundError')) {
        errorMessage += 'لم يتم العثور على كاميرا خلفية';
    } else if (error.message.includes('NotSupportedError')) {
        errorMessage += 'المتصفح لا يدعم الكاميرا';
    } else if (error.message.includes('NotReadableError')) {
        errorMessage += 'الكاميرا مستخدمة من قبل تطبيق آخر';
    } else {
        errorMessage += error.message;
    }
    
    document.getElementById('camera-status').textContent = errorMessage;
    document.getElementById('camera-status').style.background = '#f8d7da';
    showResult(errorMessage, 'error');
}

// إيقاف مسح الباركود
async function stopBarcodeScanner() {
    try {
        if (html5QrcodeScanner && isScanning) {
            await html5QrcodeScanner.stop();
            html5QrcodeScanner.clear();
            isScanning = false;
            document.getElementById('camera-status').textContent = 'تم إيقاف المسح';
            document.getElementById('camera-status').style.background = '#fff3cd';
            console.log('تم إيقاف الماسح');
        }
    } catch (error) {
        console.error('خطأ في إيقاف الماسح:', error);
    }
}

// عند نجاح المسح
function onScanSuccess(decodedText, decodedResult) {
    console.log('تم مسح الباركود:', decodedText);
    
    document.getElementById('barcode-value').textContent = decodedText;
    document.getElementById('camera-meter-number').value = decodedText;
    document.getElementById('barcode-result').style.display = 'block';
    
    showResult('✅ تم قراءة الباركود بنجاح', 'success');
    
    // إيقاف المسح تلقائياً بعد القراءة الناجحة
    setTimeout(() => {
        stopBarcodeScanner();
        document.getElementById('camera-status').textContent = 'تم قراءة الباركود بنجاح!';
        document.getElementById('camera-status').style.background = '#d1ecf1';
    }, 2000);
}

// عند فشل المسح
function onScanFailure(error) {
    // لا تفعل شيء - هذه الدالة تُستدعى باستمرار أثناء المسح
}

// الحصول على الموقع الجغرافي بدقة عالية
function getCurrentLocation(tabPrefix) {
    const locationInfo = document.getElementById(tabPrefix + '-location-info');
    const latitudeInput = document.getElementById(tabPrefix + '-latitude');
    const longitudeInput = document.getElementById(tabPrefix + '-longitude');
    const accuracyInput = document.getElementById(tabPrefix + '-location-accuracy');
    
    if (!navigator.geolocation) {
        showResult('المتصفح لا يدخدم خدمة تحديد الموقع', 'error');
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
async function submitData(inputMethod) {
    // جمع البيانات من جميع الحقول
    const formData = collectFormData(inputMethod);
    
    if (!formData.meterNumber) {
        showResult('يرجى إدخال رقم العداد', 'error');
        return;
    }
    
    if (!formData.technicianName) {
        showResult('يرجى إدخال اسم الفني', 'error');
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
        clearForm(inputMethod);
        
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        showResult('❌ خطأ في إرسال البيانات: ' + error.message, 'error');
    }
}

// جمع البيانات من النموذج
function collectFormData(inputMethod) {
    return {
        meterNumber: document.getElementById(inputMethod + '-meter-number').value.trim(),
        technicianName: document.getElementById(inputMethod + '-technician-name').value.trim(),
        meterType: document.getElementById(inputMethod + '-meter-type').value,
        meterBrand: document.getElementById(inputMethod + '-meter-brand').value,
        valveType: document.getElementById(inputMethod + '-valve-type').value,
        valveStatus: document.getElementById(inputMethod + '-valve-status').value,
        boxStatus: document.getElementById(inputMethod + '-box-status').value,
        plotNumber: document.getElementById(inputMethod + '-plot-number').value.trim(),
        propertyType: document.getElementById(inputMethod + '-property-type').value,
        propertyStatus: document.getElementById(inputMethod + '-property-status').value,
        district: document.getElementById(inputMethod + '-district').value.trim(),
        electricMetersCount: document.getElementById(inputMethod + '-electric-meters-count').value,
        encroachment: document.getElementById(inputMethod + '-encroachment').checked ? 'نعم' : 'لا',
        latitude: document.getElementById(inputMethod + '-latitude').value,
        longitude: document.getElementById(inputMethod + '-longitude').value,
        locationAccuracy: document.getElementById(inputMethod + '-location-accuracy').value,
        notes: document.getElementById(inputMethod + '-notes').value.trim(),
        inputMethod: inputMethod === 'camera' ? 'مسح الباركود' : 'إدخال يدوي',
        timestamp: new Date().toISOString()
    };
}

// مسح النموذج
function clearForm(inputMethod) {
    const form = document.getElementById(inputMethod + '-tab');
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else if (input.type === 'number') {
            input.value = '';
        } else {
            input.value = '';
        }
    });
    
    document.getElementById('barcode-result').style.display = 'none';
    document.getElementById(inputMethod + '-location-info').style.display = 'none';
    
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

// نسخ هيكل تبويب الكاميرا إلى تبويب الإدخال اليدوي
function initializeManualTab() {
    const cameraTab = document.getElementById('camera-tab');
    const manualTab = document.getElementById('manual-tab');
    
    // نسخ المحتوى مع تغيير البادئة
    manualTab.innerHTML = cameraTab.innerHTML.replace(/camera-/g, 'manual-');
    
    // إزالة قسم الباركود من التبويب اليدوي
    const barcodeSection = manualTab.querySelector('#reader');
    const barcodeResult = manualTab.querySelector('#barcode-result');
    const cameraStatus = manualTab.querySelector('#manual-status');
    
    if (barcodeSection) barcodeSection.remove();
    if (barcodeResult) barcodeResult.remove();
    if (cameraStatus) cameraStatus.remove();
}

// فتح console لأغراض التصحيح
function openDebugConsole() {
    console.log('=== بدء التصحيح ===');
    console.log('المتصفح:', navigator.userAgent);
    console.log('يدعم الكاميرا:', !!navigator.mediaDevices);
    console.log('يدخدم الموقع:', !!navigator.geolocation);
    console.log('الرابط:', window.location.href);
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل التطبيق بنجاح');
    initializeManualTab();
    openDebugConsole();
});

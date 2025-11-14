// تطبيق نظام إدارة العدادات - JavaScript
let html5QrcodeScanner = null;
let isScanning = false;
let currentLocation = null;
const images = {};

// تبديل التبويبات
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    if (isScanning && tabName !== 'camera') {
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
        let errorMessage = 'خطأ في تشغيل الكاميرا: ';
        
        if (error.message.includes('NotAllowedError')) {
            errorMessage += 'تم رفض الإذن. يرجى السماح باستخدام الكاميرا';
        } else if (error.message.includes('NotFoundError')) {
            errorMessage += 'لم يتم العثور على كاميرا خلفية';
        } else if (error.message.includes('NotSupportedError')) {
            errorMessage += 'المتصفح لا يدعم الكاميرا';
        } else {
            errorMessage += error.message;
        }
        
        document.getElementById('camera-status').textContent = errorMessage;
        document.getElementById('camera-status').style.background = '#f8d7da';
        showResult(errorMessage, 'error');
    }
}

// تحميل مكتبة مسح الباركود
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

// عند نجاح مسح الباركود
function onScanSuccess(decodedText, decodedResult) {
    console.log('تم مسح الباركود:', decodedText);
    
    // عرض النتيجة في تبويب المسح
    document.getElementById('barcode-value').textContent = decodedText;
    document.getElementById('barcode-result').style.display = 'block';
    
    // نقل الرقم إلى حقل رقم العداد في التبويب الرئيسي
    document.getElementById('meterNumber').value = decodedText;
    
    showResult('✅ تم قراءة الباركود بنجاح وتم تعبئة رقم العداد تلقائياً', 'success');
    
    // الانتقال التلقائي إلى التبويب الرئيسي بعد 2 ثانية
    setTimeout(() => {
        switchTab('main');
        stopBarcodeScanner();
    }, 2000);
}

// عند فشل المسح
function onScanFailure(error) {
    // لا تفعل شيء - هذه الدالة تُستدعى باستمرار أثناء المسح
}

// الحصول على الموقع الحالي
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showResult('المتصفح لا يدعم خدمة الموقع', 'error');
        return;
    }

    document.getElementById('location-status').textContent = 'جاري الحصول على الموقع...';
    document.getElementById('location-status').style.background = '#fff3cd';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            currentLocation = { lat, lng, accuracy };
            
            // تحديث الحقول
            document.getElementById('latitude').value = lat.toFixed(8);
            document.getElementById('longitude').value = lng.toFixed(8);
            
            // عرض الموقع
            document.getElementById('location-status').innerHTML = `
                <strong>تم الحصول على الموقع بنجاح:</strong><br>
                <strong>خط العرض:</strong> ${lat.toFixed(8)}<br>
                <strong>خط الطول:</strong> ${lng.toFixed(8)}<br>
                <strong>الدقة:</strong> ±${accuracy.toFixed(2)} متر
            `;
            document.getElementById('location-status').style.background = '#d4edda';
            
            showResult('📍 تم الحصول على الموقع بدقة عالية', 'success');
        },
        function(error) {
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
            
            document.getElementById('location-status').textContent = errorMessage;
            document.getElementById('location-status').style.background = '#f8d7da';
            showResult(errorMessage, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000
        }
    );
}

// مسح الإحداثيات
function clearLocation() {
    currentLocation = null;
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    document.getElementById('location-status').textContent = 'لم يتم الحصول على الموقع بعد';
    document.getElementById('location-status').style.background = '#e9ecef';
    showResult('تم مسح الإحداثيات', 'success');
}

// التقاط الصور
function takePhoto(imageType) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // استخدام الكاميرا الخلفية على الجوال
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                images[imageType] = e.target.result;
                displayImagePreview(imageType, e.target.result);
                showResult(`✅ تم رفع ${getImageTypeName(imageType)} بنجاح`, 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// الحصول على اسم نوع الصورة
function getImageTypeName(imageType) {
    const names = {
        'meterImage': 'صورة العداد',
        'pieceNumberImage': 'صورة رقم القطعة',
        'propertyImage': 'صورة العقار',
        'electricMetersImage': 'صورة عدادات الكهرباء',
        'valveImage': 'صورة المحبس',
        'boxImage': 'صورة الصندوق',
        'encroachmentImage': 'صورة التعدي'
    };
    return names[imageType] || 'الصورة';
}

// عرض معاينة الصورة
function displayImagePreview(imageType, imageData) {
    let previewContainer = document.getElementById('image-previews');
    let existingPreview = document.getElementById(`preview-${imageType}`);
    
    if (existingPreview) {
        existingPreview.src = imageData;
    } else {
        const img = document.createElement('img');
        img.id = `preview-${imageType}`;
        img.className = 'image-preview';
        img.src = imageData;
        img.alt = getImageTypeName(imageType);
        img.title = getImageTypeName(imageType);
        
        // إضافة زر حذف
        img.onclick = function() {
            if (confirm(`هل تريد حذف ${getImageTypeName(imageType)}؟`)) {
                delete images[imageType];
                img.remove();
                showResult(`تم حذف ${getImageTypeName(imageType)}`, 'success');
            }
        };
        
        previewContainer.appendChild(img);
    }
}

// إرسال جميع البيانات
async function submitAllData() {
    try {
        // التحقق من الحقول المطلوبة
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
            showResult(`❌ يرجى ملء جميع الحقول المطلوبة: ${missingFields.join(', ')}`, 'error');
            return;
        }
        
        // التحقق من الموقع
        if (!currentLocation) {
            showResult('❌ يرجى الحصول على الموقع أولاً', 'error');
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
            // إضافة الصور
            meterImage: images.meterImage || '',
            pieceNumberImage: images.pieceNumberImage || '',
            propertyImage: images.propertyImage || '',
            electricMetersImage: images.electricMetersImage || '',
            valveImage: images.valveImage || '',
            boxImage: images.boxImage || '',
            encroachmentImage: images.encroachmentImage || ''
        };
        
        console.log('بيانات المرسلة:', formData);
        
        // رابط Google Apps Script - استبدله برابطك
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwB8R4SMWi5zocK2_Io0TaeGQSuh126an4RoHAFODQvtJSQeVkIGU6ynhR2F0_yD_Bk/exec';
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showResult('✅ تم حفظ جميع البيانات بنجاح في Google Sheets', 'success');
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
        
        // مسح الصور
        document.getElementById('image-previews').innerHTML = '';
        Object.keys(images).forEach(key => delete images[key]);
        
        // مسح الموقع
        clearLocation();
        
        // مسح نتيجة الباركود
        document.getElementById('barcode-result').style.display = 'none';
        
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

// فتح console للتصحيح
function openDebugConsole() {
    console.log('=== بدء التصحيح ===');
    console.log('المتصفح:', navigator.userAgent);
    console.log('يدعم الكاميرا:', !!navigator.mediaDevices);
    console.log('يدعم الموقع:', !!navigator.geolocation);
    console.log('الصور المرفوعة:', Object.keys(images));
    console.log('الموقع الحالي:', currentLocation);
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل تطبيق إدارة العدادات بنجاح');
    
    // إضافة تنبيه لأهمية الموقع
    setTimeout(() => {
        showResult('📍 يرجى الحصول على الموقع أولاً لأهميته في تسجيل البيانات', 'success');
    }, 2000);
});

// تطبيق JavaScript الرئيسي - النسخة المعدلة
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOYAO_FJ0adR4mBw7ie0XzgPgL-8kknumw2FbwsNBqLlcpSFBKIfckRMexvsZhdMck/exec'; // استبدل برابط النشر

let html5QrcodeScanner = null;
let isScanning = false;

// تبديل التبويبات
function switchTab(tabName) {
    // إخفاء جميع المحتويات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إلغاء تنشيط جميع الأزرار
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // إظهار المحتوى المحدد
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // تنشيط الزر المحدد
    event.target.classList.add('active');
    
    // إيقاف الماسح إذا كان نشطاً
    if (isScanning) {
        stopBarcodeScanner();
    }
}

// بدء مسح الباركود
async function startBarcodeScanner() {
    try {
        if (isScanning) {
            alert('الماسح يعمل بالفعل!');
            return;
        }

        document.getElementById('camera-status').textContent = 'جاري تهيئة الكاميرا...';
        
        // إنشاء ماسح جديد
        html5QrcodeScanner = new Html5Qrcode("reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            supportedScanTypes: [
                Html5QrcodeScanType.SCAN_TYPE_QR_CODE,
                Html5QrcodeScanType.SCAN_TYPE_CAMERA
            ]
        };

        // بدء المسح
        await html5QrcodeScanner.start(
            { facingMode: "environment" }, 
            config,
            onScanSuccess,
            onScanFailure
        );
        
        isScanning = true;
        document.getElementById('camera-status').textContent = 'الماسح نشط - وجّه الكاميرا نحو الباركود';
        document.getElementById('camera-status').style.background = '#d4edda';
        
    } catch (error) {
        console.error('خطأ في تشغيل الماسح:', error);
        document.getElementById('camera-status').textContent = 'خطأ في تشغيل الكاميرا: ' + error.message;
        document.getElementById('camera-status').style.background = '#f8d7da';
    }
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
        }
    } catch (error) {
        console.error('خطأ في إيقاف الماسح:', error);
    }
}

// عند نجاح المسح
function onScanSuccess(decodedText, decodedResult) {
    console.log(`تم مسح الكود: ${decodedText}`, decodedResult);
    
    document.getElementById('barcode-value').textContent = decodedText;
    document.getElementById('camera-meter-number').value = decodedText;
    document.getElementById('barcode-result').style.display = 'block';
    
    // إيقاف المسح تلقائياً بعد القراءة الناجحة
    setTimeout(() => {
        stopBarcodeScanner();
        document.getElementById('camera-status').textContent = 'تم قراءة الباركود بنجاح!';
        document.getElementById('camera-status').style.background = '#d1ecf1';
    }, 1000);
}

// عند فشل المسح
function onScanFailure(error) {
    // لا تفعل شيء - هذه الدالة تُستدعى باستمرار أثناء المسح
    // console.log('جاري المسح...', error);
}

// إرسال البيانات إلى Google Sheets
async function submitData(inputMethod) {
    const meterNumber = document.getElementById(inputMethod + '-meter-number').value;
    const notes = document.getElementById(inputMethod + '-notes').value;
    
    if (!meterNumber) {
        showResult('يرجى إدخال رقم العداد', 'error');
        return;
    }
    
    try {
        showResult('جاري حفظ البيانات...', 'success');
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meterNumber: meterNumber,
                notes: notes,
                inputMethod: inputMethod === 'camera' ? 'مسح الباركود' : 'إدخال يدوي'
            })
        });
        
        const result = await response.text();
        console.log('استجابة السيرفر:', result);
        
        // محاولة تحليل JSON
        let jsonResult;
        try {
            jsonResult = JSON.parse(result);
        } catch (e) {
            // إذا لم يكن JSON، اعتبره نجاحاً
            jsonResult = { status: 'success', message: 'تم الحفظ' };
        }
        
        if (jsonResult.status === 'success') {
            showResult('✅ تم حفظ البيانات بنجاح في Google Sheets', 'success');
            // مسح الحقول
            document.getElementById(inputMethod + '-meter-number').value = '';
            document.getElementById(inputMethod + '-notes').value = '';
            document.getElementById('barcode-result').style.display = 'none';
        } else {
            showResult('❌ خطأ في حفظ البيانات: ' + (jsonResult.message || 'غير معروف'), 'error');
        }
        
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        showResult('❌ خطأ في الاتصال: ' + error.message, 'error');
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
    console.log('تم تحميل التطبيق بنجاح');
});

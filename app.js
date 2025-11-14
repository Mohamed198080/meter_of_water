// تطبيق JavaScript الرئيسي - مع تصحيح الأخطاء
let html5QrcodeScanner = null;
let isScanning = false;

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

// بدء مسح الباركود مع تصحيح الأخطاء
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

// إرسال البيانات إلى Google Sheets مع تصحيح الأخطاء
async function submitData(inputMethod) {
    const meterNumber = document.getElementById(inputMethod + '-meter-number').value.trim();
    const notes = document.getElementById(inputMethod + '-notes').value.trim();
    
    if (!meterNumber) {
        showResult('يرجى إدخال رقم العداد', 'error');
        return;
    }
    
    try {
        showResult('جاري حفظ البيانات...', 'success');
        
        // رابط Google Apps Script - استبدله برابطك
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOYAO_FJ0adR4mBw7ie0XzgPgL-8kknumw2FbwsNBqLlcpSFBKIfckRMexvsZhdMck/exec';
        
        console.log('إرسال البيانات:', { meterNumber, notes, inputMethod });
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // مهم للـ Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meterNumber: meterNumber,
                notes: notes,
                inputMethod: inputMethod === 'camera' ? 'مسح الباركود' : 'إدخال يدوي'
            })
        });
        
        // مع no-cors لا يمكننا قراءة الاستجابة، لكن نعتبره نجاحاً
        showResult('✅ تم إرسال البيانات بنجاح', 'success');
        
        // مسح الحقول
        document.getElementById(inputMethod + '-meter-number').value = '';
        document.getElementById(inputMethod + '-notes').value = '';
        document.getElementById('barcode-result').style.display = 'none';
        
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        showResult('❌ خطأ في إرسال البيانات: ' + error.message, 'error');
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

// فتح console لأغراض التصحيح
function openDebugConsole() {
    console.log('=== بدء التصحيح ===');
    console.log('المتصفح:', navigator.userAgent);
    console.log('يدعم الكاميرا:', !!navigator.mediaDevices);
    console.log('الرابط:', window.location.href);
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل التطبيق بنجاح');
    openDebugConsole();
});

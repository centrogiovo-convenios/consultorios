document.addEventListener('DOMContentLoaded', () => {
    // Inicializar con colposcopia
    toggleReportType();
    applyLogo();
});

function loadAndSaveImage(event, storageKey, applyCallback) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            localStorage.setItem(storageKey, base64);
            applyCallback();
            alert("Imagen guardada correctamente. Ya no tendrás errores al generar el PDF.");
        };
        reader.readAsDataURL(file);
    }
}

function applyLogo() {
    const base64 = localStorage.getItem('logoBase64');
    const logoImg = document.getElementById('main-logo');
    if (logoImg) {
        if (base64) {
            logoImg.src = base64;
            logoImg.style.display = 'block';
        } else {
            logoImg.style.display = 'none';
        }
    }
}

function applySignature() {
    let sigImg = document.getElementById('firma-imagen');
    const base64 = localStorage.getItem('firmaDigitalBase64');
    
    if (base64) {
        if (!sigImg) {
            sigImg = document.createElement('img');
            sigImg.id = 'firma-imagen';
            sigImg.className = 'signature-img';
            document.getElementById('signature-container').appendChild(sigImg);
        }
        sigImg.src = base64;
        sigImg.style.display = 'block';
    } else {
        if (sigImg) sigImg.style.display = 'none';
    }
}

function toggleReportType() {
    const isColpo = document.querySelector('input[name="reportType"][value="colpo"]').checked;
    const dynamicContent = document.getElementById('dynamic-content');
    const titleType = document.getElementById('title-type');
    
    // Limpiar contenido actual
    dynamicContent.innerHTML = '';
    
    if (isColpo) {
        titleType.textContent = 'COLPOSCOPÍA';
        const template = document.getElementById('tpl-colposcopia');
        dynamicContent.appendChild(template.content.cloneNode(true));
        // Inicializar canvas después de inyectar
        setTimeout(initCanvas, 50);
    } else {
        titleType.textContent = 'VIDEOCOLPOSCOPÍA';
        const template = document.getElementById('tpl-videocolposcopia');
        dynamicContent.appendChild(template.content.cloneNode(true));
    }
}

function toggleSignature() {
    const isDigital = document.querySelector('input[name="signatureType"][value="digital"]').checked;
    let sigImg = document.getElementById('firma-imagen');
    
    if (isDigital) {
        applySignature();
    } else {
        if (sigImg) {
            sigImg.style.display = 'none';
        }
    }
}

// Inicializar la firma
toggleSignature();

// Lógica de dibujo libre en el atlas
let isDrawing = false;
let drawMode = 'draw'; // 'draw' o 'erase'
let ctx = null;
let canvas = null;

function initCanvas() {
    canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Soporte táctil básico
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e.touches[0]); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); }, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing || !ctx || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (drawMode === 'draw') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'red';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    } else if (drawMode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
}

function stopDrawing() {
    isDrawing = false;
    if (ctx) ctx.beginPath();
}

window.setDrawMode = function(mode) {
    drawMode = mode;
}

window.clearCanvas = function() {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Funciones para imágenes (Videocolposcopia)
function triggerUpload(inputId) {
    document.getElementById(inputId).click();
}

function loadImage(event, previewId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.getElementById(previewId);
            imgElement.src = e.target.result;
            // Ocultar el hint
            const hint = imgElement.nextElementSibling;
            if (hint && hint.classList.contains('upload-hint')) {
                hint.style.display = 'none';
            }
        }
        reader.readAsDataURL(file);
    }
}

// Función para generar PDF
function generatePDF() {
    const element = document.getElementById('report-document');
    
    // Obtener datos del paciente
    const nombreRaw = document.getElementById('paciente-nombre').value.trim();
    const dniRaw = document.getElementById('paciente-dni').value.trim();
    
    // Limpiar caracteres especiales para el nombre del archivo
    const nombre = nombreRaw ? nombreRaw.replace(/[^a-zA-Z0-9 ]/g, "") : 'Paciente';
    const dni = dniRaw ? dniRaw.replace(/[^0-9]/g, "") : 'SinDNI';
    
    // Opciones para html2pdf
    const isColpo = document.querySelector('input[name="reportType"][value="colpo"]').checked;
    const tipo = isColpo ? 'Colpo' : 'VideoColpo';
    const filename = `${nombre}_${dni}_${tipo}.pdf`.replace(/ /g, "_");
    
    const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Cambiar estado del botón
    const btnSave = document.querySelector('.btn-primary');
    const originalText = btnSave.textContent;
    btnSave.textContent = 'Guardando en Drive...';
    btnSave.disabled = true;
    
    // Añadir temporalmente una clase para ocultar elementos "no-print" dentro del area de PDF
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');
    
    // Generar PDF y enviarlo a Google Drive
    html2pdf().set(opt).from(element).outputPdf('datauristring').then((pdfBase64) => {
        // Restaurar elementos
        noPrintElements.forEach(el => el.style.display = '');
        
        // Quitar el prefijo de base64
        const base64Data = pdfBase64.split(',')[1];
        
        // URL de tu Google Apps Script (Nueva carpeta)
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbzNPHgn0x44cMlh16QVtwGnGfPQ0hRx40GnT8q3wX38py6Zg_4-TQbV1mbG712GVECMJA/exec';
        
        // Usamos no-cors para evitar bloqueos de seguridad del navegador al enviar a Google
        fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({
                filename: filename,
                fileBase64: base64Data
            })
        })
        .then(() => {
            // Con no-cors no podemos leer la respuesta, pero si llega aquí se envió.
            alert('¡El documento fue enviado! Revisa tu carpeta de Google Drive.');
        })
        .catch(error => {
            console.error('Error enviando a Drive:', error);
            alert('Hubo un problema de conexión. Verifica si se guardó en Drive.');
        })
        .finally(() => {
            btnSave.textContent = originalText;
            btnSave.disabled = false;
        });
    }).catch(err => {
        console.error('Error generando PDF:', err);
        alert('Hubo un error al generar el PDF. Verifica que la imagen del logo o la firma estén correctas.');
        noPrintElements.forEach(el => el.style.display = '');
        btnSave.textContent = originalText;
        btnSave.disabled = false;
    });
}

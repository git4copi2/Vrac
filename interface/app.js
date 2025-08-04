// Application JavaScript Vanilla
class NewsletterInterface {
    constructor() {
        this.files = {
            html: null,
            excel: null
        };
        this.conseillers = [];
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.updateUI();
    }

    setupElements() {
        // Dropzones
        this.dropzoneHtml = document.getElementById('dropzone-html');
        this.dropzoneExcel = document.getElementById('dropzone-excel');
        
        // Inputs
        this.inputHtml = document.getElementById('input-html');
        this.inputExcel = document.getElementById('input-excel');
        
        // Boutons
        this.btnProcess = document.getElementById('btn-process');
        this.btnContinue = document.getElementById('btn-continue');
        
        // Sections
        this.conseillerSection = document.getElementById('conseiller-section');
        this.selectConseiller = document.getElementById('select-conseiller');
        
        // Infos fichiers
        this.htmlInfo = document.getElementById('html-info');
        this.excelInfo = document.getElementById('excel-info');
        this.htmlFilename = document.getElementById('html-filename');
        this.excelFilename = document.getElementById('excel-filename');
        
        // Messages
        this.statusMessage = document.getElementById('status-message');
    }

    setupEventListeners() {
        // Drag & Drop HTML
        this.setupDragDrop(this.dropzoneHtml, this.inputHtml, 'html');
        
        // Drag & Drop Excel
        this.setupDragDrop(this.dropzoneExcel, this.inputExcel, 'excel');
        
        // Input changes
        this.inputHtml.addEventListener('change', (e) => this.handleFileSelect(e, 'html'));
        this.inputExcel.addEventListener('change', (e) => this.handleFileSelect(e, 'excel'));
        
        // Boutons remove
        document.getElementById('remove-html').addEventListener('click', () => this.removeFile('html'));
        document.getElementById('remove-excel').addEventListener('click', () => this.removeFile('excel'));
        
        // Bouton process
        this.btnProcess.addEventListener('click', () => this.processFiles());
        
        // Bouton continue
        this.btnContinue.addEventListener('click', () => this.continueToNextStep());
        
        // Sélection conseiller
        this.selectConseiller.addEventListener('change', () => this.updateContinueButton());
    }

    setupDragDrop(dropzone, input, type) {
        // Empêcher le comportement par défaut
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Gestion visuelle du drag
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('dragover');
            });
        });

        // Gestion du drop
        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0], type);
            }
        });

        // Clic sur dropzone
        dropzone.addEventListener('click', () => {
            input.click();
        });
    }

    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file, type);
        }
    }

    handleFile(file, type) {
        // Validation du type de fichier
        if (type === 'html' && !file.name.match(/\.(html|htm)$/i)) {
            this.showStatus('Veuillez sélectionner un fichier HTML valide.', 'error');
            return;
        }
        
        if (type === 'excel' && !file.name.match(/\.(xlsx|xls)$/i)) {
            this.showStatus('Veuillez sélectionner un fichier Excel valide.', 'error');
            return;
        }

        // Stocker le fichier
        this.files[type] = file;
        
        // Afficher l'info
        this.displayFileInfo(file, type);
        
        // Mettre à jour l'UI
        this.updateUI();
        
        this.showStatus(`Fichier ${type.toUpperCase()} ajouté avec succès.`, 'success');
    }

    displayFileInfo(file, type) {
        const infoElement = type === 'html' ? this.htmlInfo : this.excelInfo;
        const filenameElement = type === 'html' ? this.htmlFilename : this.excelFilename;
        
        filenameElement.textContent = file.name;
        infoElement.style.display = 'flex';
        
        // Cacher la dropzone
        const dropzone = type === 'html' ? this.dropzoneHtml : this.dropzoneExcel;
        dropzone.style.display = 'none';
    }

    removeFile(type) {
        this.files[type] = null;
        
        // Réinitialiser l'input
        const input = type === 'html' ? this.inputHtml : this.inputExcel;
        input.value = '';
        
        // Cacher l'info et remontrer la dropzone
        const infoElement = type === 'html' ? this.htmlInfo : this.excelInfo;
        const dropzone = type === 'html' ? this.dropzoneHtml : this.dropzoneExcel;
        
        infoElement.style.display = 'none';
        dropzone.style.display = 'block';
        
        this.updateUI();
        this.showStatus(`Fichier ${type.toUpperCase()} supprimé.`, 'info');
    }

    updateUI() {
        // Activer/désactiver le bouton process
        const bothFilesSelected = this.files.html && this.files.excel;
        this.btnProcess.disabled = !bothFilesSelected;
        
        // Mettre à jour le texte du bouton
        if (bothFilesSelected) {
            this.btnProcess.textContent = 'Traiter les fichiers';
        } else {
            this.btnProcess.textContent = 'Sélectionnez les deux fichiers';
        }
    }

    updateContinueButton() {
        this.btnContinue.disabled = !this.selectConseiller.value;
    }

    async processFiles() {
        if (!this.files.html || !this.files.excel) {
            this.showStatus('Veuillez sélectionner les deux fichiers.', 'error');
            return;
        }

        this.showStatus('Traitement en cours...', 'info');
        this.btnProcess.disabled = true;
        this.btnProcess.textContent = 'Traitement...';

        try {
            // Traiter le fichier HTML en Markdown
            const htmlContent = await this.readFileAsText(this.files.html);
            const markdownContent = await NewsletterUtils.htmlToMarkdown(htmlContent);
            
            console.log('MARKDOWN:', markdownContent);
            // Traiter le fichier Excel
            const excelData = await NewsletterUtils.parseExcelFile(this.files.excel);
            
            // Extraire les conseillers
            this.conseillers = NewsletterUtils.extractConseillers(excelData);
            
            // Sauvegarder les données traitées
            this.workflowData = {
                htmlFile: this.files.html.name,
                excelFile: this.files.excel.name,
                markdownContent: markdownContent,
                excelData: excelData,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('newsletterWorkflow', JSON.stringify(this.workflowData));
            
            // Afficher la section conseiller
            this.displayConseillers();
            
            this.showStatus('Fichiers traités avec succès ! Sélectionnez un conseiller.', 'success');
            
        } catch (error) {
            this.showStatus('Erreur lors du traitement : ' + error.message, 'error');
            this.btnProcess.disabled = false;
            this.btnProcess.textContent = 'Traiter les fichiers';
        }
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    displayConseillers() {
        // Vider le select
        this.selectConseiller.innerHTML = '<option value="">Sélectionnez un conseiller...</option>';
        
        // Ajouter les options
        this.conseillers.forEach(conseiller => {
            const option = document.createElement('option');
            option.value = conseiller;
            option.textContent = conseiller;
            this.selectConseiller.appendChild(option);
        });
        
        // Afficher la section
        this.conseillerSection.style.display = 'block';
        
        // Réactiver le bouton process
        this.btnProcess.disabled = false;
        this.btnProcess.textContent = 'Traiter les fichiers';
    }

    continueToNextStep() {
        const selectedConseiller = this.selectConseiller.value;
        if (!selectedConseiller) {
            this.showStatus('Veuillez sélectionner un conseiller.', 'error');
            return;
        }

        // Récupère l'ancien workflow
        let workflowData = JSON.parse(localStorage.getItem('newsletterWorkflow')) || {};

        // Mets à jour seulement ce qui change
        workflowData.selectedConseiller = selectedConseiller;
        workflowData.timestamp = new Date().toISOString();

        localStorage.setItem('newsletterWorkflow', JSON.stringify(workflowData));
        
        // Rediriger vers la page de résumé
        this.showStatus('Redirection vers l\'étape de résumé...', 'info');
        
        setTimeout(() => {
            window.location.href = 'resume.html';
        }, 1000);
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        
        // Auto-hide après 5 secondes pour les succès
        if (type === 'success') {
            setTimeout(() => {
                this.statusMessage.textContent = '';
                this.statusMessage.className = 'status-message';
            }, 5000);
        }
    }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new NewsletterInterface();
}); 

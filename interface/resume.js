// Page de résumé de la newsletter
class ResumePage {
    constructor() {
        this.workflowData = null;
        this.promptText = '';
        this.responseText = '';
        this.init();
    }

    init() {
        this.setupElements();
        this.loadWorkflowData();
        this.setupEventListeners();
        this.generatePrompt();
    }

    setupElements() {
        // Éléments d'information
        this.htmlFile = document.getElementById('html-file');
        this.excelFile = document.getElementById('excel-file');
        this.selectedConseiller = document.getElementById('selected-conseiller');
        
        // Éléments de prompt
        this.promptTextarea = document.getElementById('prompt-text');
        this.btnCopyPrompt = document.getElementById('btn-copy-prompt');
        this.btnGeneratePrompt = document.getElementById('btn-generate-prompt');
        
        // Éléments de réponse
        this.responseTextarea = document.getElementById('response-text');
        this.btnSaveResponse = document.getElementById('btn-save-response');
        this.btnClearResponse = document.getElementById('btn-clear-response');
        
        // Navigation
        this.btnBack = document.getElementById('btn-back');
        this.btnNext = document.getElementById('btn-next');
        
        // Messages
        this.statusMessage = document.getElementById('status-message');
    }

    setupEventListeners() {
        // Boutons de prompt
        this.btnCopyPrompt.addEventListener('click', () => this.copyPrompt());
        this.btnGeneratePrompt.addEventListener('click', () => this.generatePrompt());
        
        // Boutons de réponse
        this.btnSaveResponse.addEventListener('click', () => this.saveResponse());
        this.btnClearResponse.addEventListener('click', () => this.clearResponse());
        
        // Navigation
        this.btnBack.addEventListener('click', () => this.goBack());
        this.btnNext.addEventListener('click', () => this.goNext());
        
        // Écouter les changements de réponse
        this.responseTextarea.addEventListener('input', () => this.updateSaveButton());
    }

    loadWorkflowData() {
        try {
            const data = localStorage.getItem('newsletterWorkflow');
            if (!data) {
                this.showStatus('Aucune donnée de workflow trouvée. Retour à la page principale.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }

            this.workflowData = JSON.parse(data);
            this.displayWorkflowInfo();
            
        } catch (error) {
            this.showStatus('Erreur lors du chargement des données : ' + error.message, 'error');
        }
    }

    displayWorkflowInfo() {
        if (!this.workflowData) return;

        this.htmlFile.textContent = this.workflowData.htmlFile || 'Non spécifié';
        this.excelFile.textContent = this.workflowData.excelFile || 'Non spécifié';
        this.selectedConseiller.textContent = this.workflowData.selectedConseiller || 'Non spécifié';
    }

    generatePrompt() {
        if (!this.workflowData) {
            this.showStatus('Impossible de générer le prompt : données manquantes.', 'error');
            return;
        }

        // Utiliser le template de prompt réel
        const promptData = {
            newsletter: this.workflowData.markdownContent || 'Contenu de la newsletter non disponible'
        };

        this.promptText = NewsletterUtils.generatePrompt('resume', promptData);
        this.promptTextarea.value = this.promptText;
        this.showStatus('Prompt généré avec succès !', 'success');
    }

    copyPrompt() {
        if (!this.promptText) {
            this.showStatus('Aucun prompt à copier.', 'error');
            return;
        }

        navigator.clipboard.writeText(this.promptText).then(() => {
            this.showStatus('Prompt copié dans le presse-papiers !', 'success');
            this.btnCopyPrompt.textContent = '✅ Copié !';
            setTimeout(() => {
                this.btnCopyPrompt.textContent = '📋 Copier le prompt';
            }, 2000);
        }).catch(() => {
            // Fallback pour les navigateurs qui ne supportent pas clipboard API
            this.promptTextarea.select();
            document.execCommand('copy');
            this.showStatus('Prompt copié dans le presse-papiers !', 'success');
        });
    }

    updateSaveButton() {
        const hasResponse = this.responseTextarea.value.trim().length > 0;
        this.btnSaveResponse.disabled = !hasResponse;
        this.btnNext.disabled = !hasResponse;
    }

    saveResponse() {
        const response = this.responseTextarea.value.trim();
        if (!response) {
            this.showStatus('Veuillez coller une réponse avant de continuer.', 'error');
            return;
        }

        // Sauvegarder la réponse dans le workflow
        this.workflowData.newsletterResume = response;
        this.workflowData.resumeTimestamp = new Date().toISOString();
        
        localStorage.setItem('newsletterWorkflow', JSON.stringify(this.workflowData));
        
        this.showStatus('Réponse sauvegardée avec succès !', 'success');
        
        // Activer le bouton suivant
        this.btnNext.disabled = false;
    }

    clearResponse() {
        this.responseTextarea.value = '';
        this.updateSaveButton();
        this.showStatus('Zone de réponse effacée.', 'info');
    }

    goBack() {
        window.location.href = 'index.html';
    }

    goNext() {
        // Vérifier qu'une réponse a été sauvegardée
        if (!this.workflowData.newsletterResume) {
            this.showStatus('Veuillez sauvegarder votre réponse avant de continuer.', 'error');
            return;
        }

        // Rediriger vers la page suivante (conseiller.html)
        window.location.href = 'conseiller.html';
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        
        // Auto-hide pour les succès
        if (type === 'success') {
            setTimeout(() => {
                this.statusMessage.textContent = '';
                this.statusMessage.className = 'status-message';
            }, 3000);
        }
    }
}

// Initialiser la page quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new ResumePage();
}); 
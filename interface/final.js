// Page de synthèse finale
class FinalPage {
    constructor() {
        this.workflowData = null;
        this.finalPrompt = '';
        this.finalResponse = '';
        this.init();
    }

    init() {
        this.setupElements();
        this.loadWorkflowData();
        this.setupEventListeners();
        this.generateFinalPrompt();
    }

    setupElements() {
        // Éléments d'information
        this.conseillerName = document.getElementById('conseiller-name');
        this.resumeStatus = document.getElementById('resume-status');
        this.sectionsStatus = document.getElementById('sections-status');
        
        // Éléments de prompt final
        this.finalPromptTextarea = document.getElementById('final-prompt');
        this.btnCopyFinalPrompt = document.getElementById('btn-copy-final-prompt');
        this.btnGenerateFinalPrompt = document.getElementById('btn-generate-final-prompt');
        
        // Éléments de réponse finale
        this.finalResponseTextarea = document.getElementById('final-response');
        this.btnSaveFinal = document.getElementById('btn-save-final');
        this.btnClearFinal = document.getElementById('btn-clear-final');
        
        // Éléments de résultat
        this.finalResultSection = document.getElementById('final-result-section');
        this.finalResultContent = document.getElementById('final-result-content');
        this.btnDownloadResult = document.getElementById('btn-download-result');
        this.btnPrintResult = document.getElementById('btn-print-result');
        
        // Navigation
        this.btnBack = document.getElementById('btn-back');
        this.btnRestart = document.getElementById('btn-restart');
        
        // Messages
        this.statusMessage = document.getElementById('status-message');
    }

    setupEventListeners() {
        // Boutons de prompt final
        this.btnCopyFinalPrompt.addEventListener('click', () => this.copyFinalPrompt());
        this.btnGenerateFinalPrompt.addEventListener('click', () => this.generateFinalPrompt());
        
        // Boutons de réponse finale
        this.btnSaveFinal.addEventListener('click', () => this.saveFinalResponse());
        this.btnClearFinal.addEventListener('click', () => this.clearFinalResponse());
        
        // Boutons de résultat
        this.btnDownloadResult.addEventListener('click', () => this.downloadResult());
        this.btnPrintResult.addEventListener('click', () => this.printResult());
        
        // Navigation
        this.btnBack.addEventListener('click', () => this.goBack());
        this.btnRestart.addEventListener('click', () => this.restart());
        
        // Écouter les changements de réponse
        this.finalResponseTextarea.addEventListener('input', () => this.updateSaveButton());
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

        this.conseillerName.textContent = this.workflowData.selectedConseiller || 'Non spécifié';
        
        if (this.workflowData.newsletterResume) {
            this.resumeStatus.textContent = '✓ Disponible';
        } else {
            this.resumeStatus.textContent = '✗ Manquant';
        }
        
        if (this.workflowData.sectionResponses) {
            const sectionsCount = Object.keys(this.workflowData.sectionResponses).length;
            this.sectionsStatus.textContent = `${sectionsCount} sections analysées`;
        } else {
            this.sectionsStatus.textContent = '✗ Aucune section analysée';
        }
    }

    generateFinalPrompt() {
        if (!this.workflowData || !this.workflowData.newsletterResume || !this.workflowData.sectionResponses) {
            this.showStatus('Données manquantes. Retournez aux étapes précédentes.', 'error');
            return;
        }

        // Extraire les titres de la newsletter
        const titres = NewsletterUtils.extractTitresFromNewsletter(this.workflowData.markdownContent);
        
        // Créer la liste des titres avec les clients associés
        const titresWithClients = this.createTitresWithClients(titres);
        
        // Créer les commentaires des associations
        const commentaires = this.createCommentaires();

        // Générer le prompt final
        const promptData = {
            titres: titresWithClients,
            commentaires: commentaires,
            newsletter: this.workflowData.markdownContent
        };

        this.finalPrompt = NewsletterUtils.generatePrompt('final', promptData);
        this.finalPromptTextarea.value = this.finalPrompt;
        this.showStatus('Prompt final généré avec succès !', 'success');
    }

    createTitresWithClients(titres) {
        // Créer une liste des titres avec les clients associés basée sur les réponses des sections
        let titresWithClients = '';
        
        titres.forEach((titre, index) => {
            const clientsForTitre = this.getClientsForTitre(index);
            titresWithClients += `${index + 1}. ${titre}\n`;
            if (clientsForTitre.length > 0) {
                titresWithClients += `   Clients: ${clientsForTitre.join(', ')}\n`;
            }
            titresWithClients += '\n';
        });
        
        return titresWithClients;
    }

    getClientsForTitre(titreIndex) {
        // Simuler l'extraction des clients pour ce titre basée sur les réponses des sections
        // Dans une vraie implémentation, cela viendrait de l'analyse des réponses ChatGPT
        const clients = [];
        
        Object.values(this.workflowData.sectionResponses).forEach(response => {
            // Extraire les numéros de clients de la réponse (format: [['MC123'], [], ['MC456'], ...])
            const clientMatches = response.match(/MC\d+/g);
            if (clientMatches) {
                clients.push(...clientMatches);
            }
        });
        
        return [...new Set(clients)]; // Retirer les doublons
    }

    createCommentaires() {
        // Créer des commentaires basés sur les réponses des sections
        let commentaires = '';
        
        Object.entries(this.workflowData.sectionResponses).forEach(([sectionId, response]) => {
            // Extraire la partie commentaires (après les tirets ---)
            const parts = response.split('---');
            if (parts.length > 1) {
                commentaires += `Section ${sectionId}: ${parts[1].trim()}\n\n`;
            }
        });
        
        return commentaires;
    }

    copyFinalPrompt() {
        if (!this.finalPrompt) {
            this.showStatus('Aucun prompt à copier.', 'error');
            return;
        }

        navigator.clipboard.writeText(this.finalPrompt).then(() => {
            this.showStatus('Prompt final copié dans le presse-papiers !', 'success');
            this.btnCopyFinalPrompt.textContent = '✅ Copié !';
            setTimeout(() => {
                this.btnCopyFinalPrompt.textContent = '📋 Copier le prompt';
            }, 2000);
        }).catch(() => {
            this.finalPromptTextarea.select();
            document.execCommand('copy');
            this.showStatus('Prompt final copié dans le presse-papiers !', 'success');
        });
    }

    updateSaveButton() {
        const hasResponse = this.finalResponseTextarea.value.trim().length > 0;
        this.btnSaveFinal.disabled = !hasResponse;
    }

    saveFinalResponse() {
        const response = this.finalResponseTextarea.value.trim();
        if (!response) {
            this.showStatus('Veuillez coller une réponse avant de sauvegarder.', 'error');
            return;
        }

        // Sauvegarder la réponse finale
        this.workflowData.finalResponse = response;
        this.workflowData.finalTimestamp = new Date().toISOString();
        this.workflowData.workflowCompleted = true;
        
        localStorage.setItem('newsletterWorkflow', JSON.stringify(this.workflowData));
        
        // Afficher le résultat final
        this.displayFinalResult(response);
        
        this.showStatus('Synthèse finale sauvegardée avec succès !', 'success');
    }

    displayFinalResult(response) {
        this.finalResultContent.innerHTML = `
            <div class="result-header">
                <h4>Synthèse Finale - ${this.workflowData.selectedConseiller}</h4>
                <p class="result-date">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <div class="result-content">
                ${response.replace(/\n/g, '<br>')}
            </div>
        `;
        
        this.finalResultSection.style.display = 'block';
        
        // Scroll vers le résultat
        this.finalResultSection.scrollIntoView({ behavior: 'smooth' });
    }

    clearFinalResponse() {
        this.finalResponseTextarea.value = '';
        this.updateSaveButton();
        this.showStatus('Zone de réponse effacée.', 'info');
    }

    downloadResult() {
        if (!this.workflowData.finalResponse) {
            this.showStatus('Aucun résultat à télécharger.', 'error');
            return;
        }

        const content = `SYNTHÈSE FINALE - ${this.workflowData.selectedConseiller}

Date de génération : ${new Date().toLocaleDateString('fr-FR')}
Conseiller : ${this.workflowData.selectedConseiller}

${this.workflowData.finalResponse}

---
Généré par l'Interface Newsletter Vanilla`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `synthese_${this.workflowData.selectedConseiller}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus('Résultat téléchargé avec succès !', 'success');
    }

    printResult() {
        if (!this.workflowData.finalResponse) {
            this.showStatus('Aucun résultat à imprimer.', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Synthèse Finale - ${this.workflowData.selectedConseiller}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #2c3e50; }
                        .header { border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
                        .content { line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Synthèse Finale - ${this.workflowData.selectedConseiller}</h1>
                        <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div class="content">
                        ${this.workflowData.finalResponse.replace(/\n/g, '<br>')}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        this.showStatus('Impression lancée !', 'success');
    }

    goBack() {
        window.location.href = 'conseiller.html';
    }

    restart() {
        if (confirm('Êtes-vous sûr de vouloir recommencer ? Toutes les données seront effacées.')) {
            localStorage.removeItem('newsletterWorkflow');
            window.location.href = 'index.html';
        }
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        
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
    new FinalPage();
}); 
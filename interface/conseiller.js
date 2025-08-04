// Page d'analyse par section du conseiller
class ConseillerPage {
    constructor() {
        this.workflowData = null;
        this.sections = [];
        this.sectionResponses = {};
        this.init();
    }

    init() {
        this.setupElements();
        this.loadWorkflowData();
        this.setupEventListeners();
        this.generateSections();
    }

    setupElements() {
        // Éléments d'information
        this.conseillerName = document.getElementById('conseiller-name');
        this.resumeStatus = document.getElementById('resume-status');
        this.sectionsCount = document.getElementById('sections-count');
        
        // Container des sections
        this.sectionsList = document.getElementById('sections-list');
        
        // Navigation
        this.btnBack = document.getElementById('btn-back');
        this.btnNext = document.getElementById('btn-next');
        
        // Messages
        this.statusMessage = document.getElementById('status-message');
    }

    setupEventListeners() {
        // Navigation
        this.btnBack.addEventListener('click', () => this.goBack());
        this.btnNext.addEventListener('click', () => this.goNext());
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
    }

    generateSections() {
        if (!this.workflowData || !this.workflowData.excelData) {
            this.showStatus('Données Excel manquantes. Retournez à l\'étape précédente.', 'error');
            return;
        }

        // Filtrer les données par conseiller sélectionné
        const conseillerData = NewsletterUtils.filterByConseiller(
            this.workflowData.excelData, 
            this.workflowData.selectedConseiller
        );

        // Traiter les données pour créer les sections
        const processedClients = this.processClientData(conseillerData);
        
        // Grouper les clients par taille (max 80 instruments par groupe)
        const clientGroups = NewsletterUtils.groupClientsBySize(processedClients, 80);
        
        // Créer les sections basées sur les groupes
        this.sections = clientGroups.map((group, index) => {
            const totalInstruments = group.reduce((sum, client) => 
                sum + (client.INSTRUMENTS_DATA ? client.INSTRUMENTS_DATA.length : 0), 0);
            
            return {
                id: `section_${index + 1}`,
                name: `Groupe ${index + 1}`,
                description: `${group.length} clients, ${totalInstruments} instruments`,
                clients: group,
                totalInstruments: totalInstruments,
                totalClients: group.length
            };
        });

        this.sectionsCount.textContent = `${this.sections.length} sections`;
        this.renderSections();
    }

    processClientData(excelData) {
        const processedClients = [];
        const processedPortfolios = new Set();
        
        for (const row of excelData) {
            const portfolio = row['Portfolio'];
            
            if (!portfolio || processedPortfolios.has(portfolio)) {
                continue;
            }
            
            processedPortfolios.add(portfolio);
            
            // Filtrer toutes les lignes pour ce portfolio
            const portfolioData = excelData.filter(r => r['Portfolio'] === portfolio);
            
            // Extraire les instruments uniques
            const seenInstruments = new Set();
            const instrumentsData = [];
            
            for (const dataRow of portfolioData) {
                const instrumentKey = [
                    dataRow['INSTRUMENT'] || 'N/A',
                    dataRow['EMMETEUR'] || 'N/A',
                    dataRow['INSTRUMENT.1'] || 'N/A',
                    dataRow['EMMETEUR/PAYS DE RESIDENCE'] || 'N/A'
                ].join('|');
                
                if (seenInstruments.has(instrumentKey)) {
                    continue;
                }
                
                seenInstruments.add(instrumentKey);
                
                instrumentsData.push({
                    instrument: dataRow['INSTRUMENT'] || 'N/A',
                    emmeteur: dataRow['EMMETEUR'] || 'N/A',
                    secteur: dataRow['INSTRUMENT.1'] || 'N/A',
                    country: dataRow['EMMETEUR/PAYS DE RESIDENCE'] || 'N/A'
                });
            }
            
            if (instrumentsData.length > 0) {
                processedClients.push({
                    Portfolio: portfolio,
                    INSTRUMENTS_DATA: instrumentsData
                });
            }
        }
        
        return processedClients;
    }

    renderSections() {
        this.sectionsList.innerHTML = '';

        this.sections.forEach((section, index) => {
            const sectionElement = this.createSectionElement(section, index);
            this.sectionsList.appendChild(sectionElement);
        });
    }

    createSectionElement(section, index) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-item';
        sectionDiv.innerHTML = `
            <div class="section-header">
                <h4>${section.name}</h4>
                <p>${section.description}</p>
                <div class="section-status" id="status-${section.id}">
                    <span class="status-pending">⏳ En attente</span>
                </div>
            </div>
            <div class="section-content" id="content-${section.id}" style="display: none;">
                <div class="prompt-section">
                    <h5>Prompt pour ChatGPT</h5>
                    <div class="prompt-container">
                        <textarea id="prompt-${section.id}" readonly placeholder="Génération du prompt..."></textarea>
                        <div class="prompt-actions">
                            <button type="button" class="btn-secondary btn-copy-prompt" data-section="${section.id}">
                                📋 Copier
                            </button>
                            <button type="button" class="btn-primary btn-generate-prompt" data-section="${section.id}">
                                🔄 Régénérer
                            </button>
                        </div>
                    </div>
                </div>
                <div class="response-section">
                    <h5>Réponse de ChatGPT</h5>
                    <div class="response-container">
                        <textarea id="response-${section.id}" placeholder="Collez ici la réponse de ChatGPT..."></textarea>
                        <div class="response-actions">
                            <button type="button" class="btn-primary btn-save-response" data-section="${section.id}" disabled>
                                💾 Sauvegarder
                            </button>
                            <button type="button" class="btn-secondary btn-clear-response" data-section="${section.id}">
                                🗑️ Effacer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="section-toggle">
                <button type="button" class="btn-secondary btn-toggle-section" data-section="${section.id}">
                    📋 Ouvrir la section
                </button>
            </div>
        `;

        // Ajouter les event listeners
        this.addSectionEventListeners(sectionDiv, section);

        return sectionDiv;
    }

    addSectionEventListeners(sectionDiv, section) {
        const sectionId = section.id;
        
        // Bouton toggle section
        const toggleBtn = sectionDiv.querySelector('.btn-toggle-section');
        toggleBtn.addEventListener('click', () => this.toggleSection(sectionId));

        // Bouton générer prompt
        const generateBtn = sectionDiv.querySelector('.btn-generate-prompt');
        generateBtn.addEventListener('click', () => this.generateSectionPrompt(sectionId));

        // Bouton copier prompt
        const copyBtn = sectionDiv.querySelector('.btn-copy-prompt');
        copyBtn.addEventListener('click', () => this.copySectionPrompt(sectionId));

        // Bouton sauvegarder réponse
        const saveBtn = sectionDiv.querySelector('.btn-save-response');
        saveBtn.addEventListener('click', () => this.saveSectionResponse(sectionId));

        // Bouton effacer réponse
        const clearBtn = sectionDiv.querySelector('.btn-clear-response');
        clearBtn.addEventListener('click', () => this.clearSectionResponse(sectionId));

        // Écouter les changements de réponse
        const responseTextarea = sectionDiv.querySelector(`#response-${sectionId}`);
        responseTextarea.addEventListener('input', () => this.updateSaveButton(sectionId));
    }

    toggleSection(sectionId) {
        const content = document.getElementById(`content-${sectionId}`);
        const toggleBtn = document.querySelector(`[data-section="${sectionId}"].btn-toggle-section`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggleBtn.textContent = '📋 Fermer la section';
            this.generateSectionPrompt(sectionId);
        } else {
            content.style.display = 'none';
            toggleBtn.textContent = '📋 Ouvrir la section';
        }
    }

    generateSectionPrompt(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        const textarea = document.getElementById(`prompt-${sectionId}`);
        
        if (!this.workflowData.newsletterResume) {
            this.showStatus('Résumé de newsletter manquant. Retournez à l\'étape précédente.', 'error');
            return;
        }

        // Extraire les titres de la newsletter
        const titres = NewsletterUtils.extractTitresFromNewsletter(this.workflowData.markdownContent);
        
        // Formater les données client pour ce groupe
        const extractionClient = NewsletterUtils.formatClientDataForPrompt(section.clients);
        
        // Générer le prompt d'analyse
        const promptData = {
            extraction_client: extractionClient,
            newsletter_resume: this.workflowData.newsletterResume,
            titres: titres.join('\n')
        };

        const prompt = NewsletterUtils.generatePrompt('analyse', promptData);
        textarea.value = prompt;
        this.showStatus(`Prompt généré pour la section "${section.name}"`, 'success');
    }

    copySectionPrompt(sectionId) {
        const textarea = document.getElementById(`prompt-${sectionId}`);
        const prompt = textarea.value;
        
        if (!prompt) {
            this.showStatus('Aucun prompt à copier.', 'error');
            return;
        }

        navigator.clipboard.writeText(prompt).then(() => {
            this.showStatus('Prompt copié dans le presse-papiers !', 'success');
            const copyBtn = document.querySelector(`[data-section="${sectionId}"].btn-copy-prompt`);
            copyBtn.textContent = '✅ Copié !';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copier';
            }, 2000);
        }).catch(() => {
            textarea.select();
            document.execCommand('copy');
            this.showStatus('Prompt copié dans le presse-papiers !', 'success');
        });
    }

    updateSaveButton(sectionId) {
        const responseTextarea = document.getElementById(`response-${sectionId}`);
        const saveBtn = document.querySelector(`[data-section="${sectionId}"].btn-save-response`);
        const hasResponse = responseTextarea.value.trim().length > 0;
        saveBtn.disabled = !hasResponse;
    }

    saveSectionResponse(sectionId) {
        const response = document.getElementById(`response-${sectionId}`).value.trim();
        if (!response) {
            this.showStatus('Veuillez coller une réponse avant de sauvegarder.', 'error');
            return;
        }

        // Sauvegarder la réponse
        this.sectionResponses[sectionId] = response;
        
        // Mettre à jour le statut
        const statusElement = document.getElementById(`status-${sectionId}`);
        statusElement.innerHTML = '<span class="status-completed">✅ Complété</span>';
        
        this.showStatus('Réponse sauvegardée avec succès !', 'success');
        this.checkAllSectionsCompleted();
    }

    clearSectionResponse(sectionId) {
        document.getElementById(`response-${sectionId}`).value = '';
        this.updateSaveButton(sectionId);
        this.showStatus('Zone de réponse effacée.', 'info');
    }

    checkAllSectionsCompleted() {
        const completedSections = Object.keys(this.sectionResponses).length;
        const totalSections = this.sections.length;
        
        if (completedSections === totalSections) {
            this.btnNext.disabled = false;
            this.showStatus('Toutes les sections sont complétées ! Vous pouvez continuer.', 'success');
        }
    }

    goBack() {
        window.location.href = 'resume.html';
    }

    goNext() {
        // Sauvegarder toutes les réponses dans le workflow
        this.workflowData.sectionResponses = this.sectionResponses;
        this.workflowData.sectionsCompleted = true;
        this.workflowData.sectionsTimestamp = new Date().toISOString();
        
        localStorage.setItem('newsletterWorkflow', JSON.stringify(this.workflowData));
        
        // Rediriger vers la page finale
        this.showStatus('Redirection vers la synthèse finale...', 'info');
        setTimeout(() => {
            window.location.href = 'final.html';
        }, 1000);
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
    new ConseillerPage();
}); 

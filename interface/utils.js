// Colonnes Excel à utiliser
const EXCEL_COLUMNS = {
    'Portfolio': 'A',
    'CODE ISIN': 'C',
    'INSTRUMENT': 'E',
    'EMMETEUR': 'F',
    'CONSEILLER': 'U',
    'INSTRUMENT.1': 'AC', // Secteur
    'EMMETEUR/PAYS DE RESIDENCE': 'AM'
};

const REQUIRED_COLUMNS = [
    'Portfolio',
    'CODE ISIN',
    'INSTRUMENT',
    'EMMETEUR',
    'CONSEILLER',
    'INSTRUMENT.1',
    'EMMETEUR/PAYS DE RESIDENCE'
];

// Utilitaires JavaScript pour reproduire la logique Python
class NewsletterUtils {
    
    // Convertir HTML en Markdown (équivalent MDFromHTML.py)
    static async htmlToMarkdown(htmlContent) {
        try {
            // Utiliser une approche simple pour extraire le texte
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // Nettoyer le HTML
            this.cleanHtml(doc);
            
            // Convertir en Markdown simple
            let markdown = this.convertToMarkdown(doc.body);
            
            return markdown;
        } catch (error) {
            console.error('Erreur conversion HTML to Markdown:', error);
            throw error;
        }
    }
    
    static cleanHtml(doc) {
        // Supprimer les éléments non désirés
        const elementsToRemove = doc.querySelectorAll('style, meta, link, script, img');
        elementsToRemove.forEach(el => el.remove());
        
        // Nettoyer les attributs de style
        const allElements = doc.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.hasAttribute('style')) el.removeAttribute('style');
            if (el.hasAttribute('class')) el.removeAttribute('class');
        });
    }
    

    static convertToMarkdown(element) {
        let markdown = '';

        for (let child of element.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                markdown += child.textContent;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.tagName.toLowerCase();

                switch (tagName) {
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        const level = parseInt(tagName.charAt(1));
                        const hashes = '#'.repeat(level);
                        markdown += `\n${hashes} ${child.textContent.trim()}\n\n`;
                        break;
                    case 'p':
                        markdown += `\n${child.textContent.trim()}\n\n`;
                        break;
                    case 'br':
                        markdown += '\n';
                        break;
                    case 'strong':
                    case 'b':
                        markdown += `**${child.textContent}**`;
                        break;
                    case 'em':
                    case 'i':
                        markdown += `*${child.textContent}*`;
                        break;
                    case 'ul':
                    case 'ol':
                        markdown += '\n';
                        const items = child.querySelectorAll('li');
                        items.forEach((item, index) => {
                            const prefix = tagName === 'ol' ? `${index + 1}.` : '-';
                            markdown += `${prefix} ${item.textContent.trim()}\n`;
                        });
                        markdown += '\n';
                        break;
                    case 'a':
                        markdown += `[${child.textContent}](${child.getAttribute('href')})`;
                        break;
                    case 'table':
                        // Simple table conversion for markdown
                        markdown += '\n';
                        const rows = child.querySelectorAll('tr');
                        rows.forEach((row, rowIndex) => {
                            const cells = row.querySelectorAll('th,td');
                            let rowData = [];
                            cells.forEach(cell => {
                                rowData.push(cell.textContent.trim());
                            });
                            markdown += '| ' + rowData.join(' | ') + ' |\n';
                            // Add separator after header
                            if (rowIndex === 0) {
                                markdown += '| ' + '--- |'.repeat(rowData.length) + '\n';
                            }
                        });
                        markdown += '\n';
                        break;
                    default:
                        markdown += this.convertToMarkdown(child);
                        break;
                }
            }
        }

        return markdown;
    }
    
    // Parser Excel et extraire les données (équivalent CreateJSONFromexcel.py)
    static async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // Convertir uniquement les colonnes nécessaires
                    let jsonData = [];
                    const range = XLSX.utils.decode_range(firstSheet['!ref']);
                    
                    for (let row = range.s.r + 1; row <= range.e.r; row++) {
                        let rowData = {};
                        let hasData = false;
                        
                        // Parcourir uniquement les colonnes requises
                        for (const [columnName, columnLetter] of Object.entries(EXCEL_COLUMNS)) {
                            const cellAddress = columnLetter + (row + 1);
                            const cell = firstSheet[cellAddress];
                            
                            if (cell) {
                                rowData[columnName] = cell.v;
                                hasData = true;
                            } else {
                                rowData[columnName] = null;
                            }
                        }
                        
                        // N'ajouter la ligne que si elle contient des données
                        if (hasData) {
                            jsonData.push(rowData);
                        }
                    }
                    
                    jsonData = jsonData.filter(row => row['CODE ISIN'] && row['CODE ISIN'].toString().trim().length > 0);
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Erreur lors du traitement du fichier Excel: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du fichier Excel'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Extraire les conseillers uniques
    static extractConseillers(excelData) {
        const conseillers = new Set();
        
        excelData.forEach(row => {
            if (row['CONSEILLER']) {
                conseillers.add(row['CONSEILLER']);
            }
        });
        
        return Array.from(conseillers);
    }
    
    // Filtrer les données par conseiller
    static filterByConseiller(excelData, conseillerName) {
        return excelData.filter(row => row['CONSEILLER'] === conseillerName);
    }
    
    // Grouper les clients par taille (équivalent group_clients_by_size)
    static groupClientsBySize(clientsData, maxInstrumentsPerGroup = 80) {
        const groups = [];
        let currentGroup = [];
        let currentTotalInstruments = 0;
        
        for (const client of clientsData) {
            const clientInstruments = client.INSTRUMENTS_DATA ? client.INSTRUMENTS_DATA.length : 0;
            
            if (currentTotalInstruments + clientInstruments > maxInstrumentsPerGroup && currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [client];
                currentTotalInstruments = clientInstruments;
            } else {
                currentGroup.push(client);
                currentTotalInstruments += clientInstruments;
            }
        }
        
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }
        
        return groups;
    }
    
    // Générer les prompts basés sur les templates JSON
    static generatePrompt(type, data) {
        const prompts = {
            resume: {
                prompt: `Voici mon fichier newsletter financière.

Mon but final est de faire une personnalisation de cette newsletter en fonctions des actions des clients.
Ton but ici est de me donner les points de la newsletter pour par la suite pouvoir identifier facilement si il y a des points qui correspondent à des placements des clients.

Donne-moi les points principaux des news avec leurs informations que tu estimes pertinentes pour la nature de chaque news.
L'identification des clients se fera avec leurs instruments, le secteur des instruments et le pays.

Envoie-moi une liste numérotée des points que tu identifies. Ajoute tous les points qu'il y a dans le sommaire et ajoute en plus des points présents dans la newsletter si tu les trouves pertinents.

NEWSLETTER :
${data.newsletter}

Exemple de sortie :
1. Eco Brésil
[ Baisse taux : -10bps (3% 1 an, 3.5% 5 ans) ]
2. Défense (Secteur) - Discussion paix Ukraine
[ Secteur : Défense, Impact positif pour : Rheinmetall, Leonardo, Thales, Dassault, BAE Systems, Zone : Europe ]
3. ...`
            },
            
            analyse: {
                prompt: `À partir de la liste des instruments d'un ou plusieurs clients et d'une newsletter, trouve les correspondances entre les instruments des clients et les titres de la newsletter.

Voici la liste des instruments des clients :
${data.extraction_client}

La newsletter entière pour un meilleur contexte :
${data.newsletter_resume}

Voici la liste des titres de la newsletter :
${data.titres}

Ta sortie se divise en deux parties :
La première consiste à me renvoyer une liste avec les numéros de client associée correspondante aux titres.
La seconde un résumé de 5 lignes maximum pour indiquer les correspondances trouvées.
Le tout séparé par des tirets "---".

Pour la liste :
- Elle aura en index i le numéro des clients correspondant au titre d'index i dans la liste des titres.
- Pour les titres précis comme des actions/entreprises associe un numéro de client uniquement si il possède un instrument explicite à cette action entreprise.
- Pour les titres plus larges comme des secteurs ou pays associe les clients plus finement mais une correspondance forte est nécessaire.

Pour le résumé : Ne mentionne dans le résumé que les correspondances riches en contexte, en justifiant brièvement la pertinence de l'association. Pour les liens évidents (ex : action détenue = titre d'entreprise), ajoute uniquement le titre et l'instrument correspondant et n'indique rien pour les correspondances faibles ou absentes. Sois synthétique et factuel, sans extrapoler.

Exemple de sortie :
[['MC209710','MC987091'],[],[MC2907309],[],[],...]
---
Résumé des secteurs intéressants pour les clients`
            },
            
            final: {
                prompt: `À partir de la liste, qui associe les titres et les clients, et des commentaires sur les associations, personnalise la newsletter pour afficher uniquement les informations nécessaires.

Pour les titres précis comme des actions/entreprise, si il n'y a que ne serait-ce qu'un seul numéro de client, considère que le titre est important. Pour les titres plus larges prend plus en compte les commentaires et le nombre de clients.

Ajoute les numéros client juste en dessous du titre en question.
Si il n'y a aucun clients associé à un titre, n'ajoute pas l'information dans la newsletter.
N'hésite pas à ajouter les commentaires si tu trouves qu'ils sont pertinents en dessous des titres correspondant, tu peux résumer les commentaires au lieu de les ajouter tel quel.
Vérifie la cohérence de l'ensemble de ton retour, il faut que ce soit fluide comme une newsletter normale, pas de liste avec des titres sans informations.
Garde le contenu des titres dans le corps de la newsletter, si par exemple titreX a des clients, et dans la newsletter on a titreX agit sur cette portion fait ci et ça, on garde ces informations dans la sortie.

Voici la liste des titres avec les clients associées :
${data.titres}

Voici les commentaires des associations des titres :
${data.commentaires}

Voici la newsletter originale en format MD :
${data.newsletter}`
            }
        };
        
        return prompts[type] ? prompts[type].prompt : '';
    }
    
    // Extraire les titres de la newsletter
    static extractTitresFromNewsletter(newsletterContent) {
        const lines = newsletterContent.split('\n');
        const titres = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') && trimmed.length > 1) {
                const titre = trimmed.replace(/^#+\s*/, '');
                if (titre.length > 0) {
                    titres.push(titre);
                }
            }
        }
        
        return titres;
    }
    
    // Formater les données client pour le prompt
    static formatClientDataForPrompt(clientsData) {
        let formatted = '';
        
        for (const client of clientsData) {
            formatted += `\nClient: ${client.Portfolio}\n`;
            if (client.INSTRUMENTS_DATA) {
                for (const instrument of client.INSTRUMENTS_DATA) {
                    formatted += `- Instrument: ${instrument.instrument}, Émetteur: ${instrument.emmeteur}, Secteur: ${instrument.secteur}, Pays: ${instrument.country}\n`;
                }
            }
            formatted += '\n';
        }
        
        return formatted;
    }
}

// Inclure la bibliothèque XLSX pour parser les fichiers Excel
// Note: Il faudrait ajouter <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script> dans le HTML 

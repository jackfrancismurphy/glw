// CSV Parser and Table Generator
class BookTableGenerator {
  constructor(csvFilePath, containerId = 'table-container') {
    this.csvFilePath = csvFilePath;
    this.containerId = containerId;
    this.data = [];
    this.headers = [];
  }

  // Parse CSV data from text
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    
    // Extract headers from first line
    this.headers = lines[0].split(',').map(h => h.trim());
    
    // Parse data rows
    this.data = lines.slice(1).map((line, index) => {
      const values = this.parseCSVLine(line);
      const row = {};
      
      this.headers.forEach((header, i) => {
        row[header] = values[i] ? values[i].trim() : '';
      });
      
      return row;
    }).filter(row => Object.values(row).some(val => val !== '')); // Remove empty rows
    
    return this.data;
  }

  // Handle CSV parsing with quoted fields
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }


  // Generate HTML table from data
  generateTable() {
    if (this.data.length === 0) {
      return '<p>No data to display</p>';
    }

    let html = '<table class="data-table">\n';
    
    // Header row
    html += '  <thead>\n    <tr>\n';
    this.headers.forEach(header => {
      html += `      <th>${this.escapeHtml(header)}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';
    
    // Data rows
    html += '  <tbody>\n';
    this.data.forEach(row => {
      html += '    <tr>\n';
      this.headers.forEach(header => {
        const value = row[header] || '';
        const displayValue = header.toLowerCase() === 'price'
          ? this.formatPrice(value)
          : value;
        html += `      <td>${this.escapeHtml(displayValue)}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n';
    html += '</table>';
    
    return html;
  }

  // Format price values with a pound sign and two decimals
  formatPrice(value) {
    const text = value.toString().trim();
    if (text === '') {
      return text;
    }

    const raw = text.replace(/^£/, '').replace(/,/g, '');
    if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
      const numeric = parseFloat(raw);
      return `£${numeric.toFixed(2)}`;
    }

    return text;
  }

  // Escape HTML special characters
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Load CSV from file and render
  async loadAndRender() {
    try {
      const response = await fetch(this.csvFilePath);
      const csvText = await response.text();
      this.parseCSV(csvText);
      this.render();
    } catch (error) {
      console.error('Error loading CSV file:', error);
      this.renderError('Failed to load CSV file');
    }
  }

  // Render table to DOM
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id '${this.containerId}' not found`);
      return;
    }
    
    container.innerHTML = this.generateTable();
  }

  // Render error message
  renderError(message) {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = `<p style="color: red;">Error: ${this.escapeHtml(message)}</p>`;
    }
  }

  // Get summary statistics
  getSummary() {
    return {
      totalRows: this.data.length,
      columns: this.headers.length,
      headers: this.headers
    };
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create table generator for your CSV file
  const tableGen = new BookTableGenerator('greg_data_my_version.csv', 'table-container');
  
  // Load and render the table
  tableGen.loadAndRender();
  
  // Log summary
  const summary = tableGen.getSummary();
  console.log(`Loaded ${summary.totalRows} rows with ${summary.columns} columns`);
});

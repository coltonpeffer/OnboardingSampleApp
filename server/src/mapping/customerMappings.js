/**
 * Per-customer mapping configuration for the Clients entity.
 * columns:   target field -> source CSV column
 * valueMaps: target field -> { source value -> target value }
 */

const customerMappings = [
  {
    id: 'customer-a',
    name: 'ABC Accounting',
    folder: 'CustomerA_ABCAccounting',
    dateFormat: 'MM/DD/YYYY',
    columns: {
      externalId: 'Client ID', name: 'Client Name', entityType: 'Business Type', status: 'Status',
      startDate: 'Date Onboarded', taxId: 'Tax ID', annualRevenue: 'Annual Revenue',
      industry: 'Industry', paymentTermsDays: 'Payment Terms', primaryContact: 'Primary Contact'
    },
    valueMaps: {
      entityType: {
        'Corporation': 'corporation', 'S-Corporation': 's_corporation', 'LLC': 'llc',
        'Partnership': 'partnership', 'Sole Proprietorship': 'sole_proprietor', 'Non-Profit': 'non_profit'
      },
      status: { 'Active': 'active', 'Inactive': 'inactive', 'Pending': 'pending' }
    }
  },
  {
    id: 'customer-b',
    name: 'XYZ Financial Services',
    folder: 'CustomerB_XYZFinancialServices',
    dateFormat: 'YYYY-MM-DD',
    columns: {
      externalId: 'clientCode', name: 'companyName', entityType: 'entityType', status: 'clientStatus',
      startDate: 'startDate', taxId: 'federalTaxId', annualRevenue: 'yearlyRevenue',
      industry: 'sectorCode', paymentTermsDays: 'billingTerms', primaryContact: 'mainContact'
    },
    valueMaps: {
      entityType: {
        'CORP': 'corporation', 'SCORP': 's_corporation', 'LLC': 'llc',
        'PART': 'partnership', 'SOLE': 'sole_proprietor', 'NPROF': 'non_profit'
      },
      status: { 'A': 'active', 'I': 'inactive', 'P': 'pending' },
      industry: {
        'CONS': 'Construction', 'ENGR': 'Engineering', 'FINS': 'Financial Services', 'HLTH': 'Healthcare',
        'HOSP': 'Hospitality', 'MEDIA': 'Media', 'MFGR': 'Manufacturing', 'SVCS': 'Services',
        'TECH': 'Technology', 'TRANS': 'Transportation'
      }
    }
  },
  {
    id: 'customer-c',
    name: 'Premier Bookkeeping',
    folder: 'CustomerC_PremierBookkeeping',
    dateFormat: 'DD-MM-YYYY',
    columns: {
      externalId: 'customer_id', name: 'business_name', entityType: 'legal_structure', status: 'account_status',
      startDate: 'registration_date', taxId: 'tax_reference', annualRevenue: 'gross_revenue',
      industry: 'industry_sector', paymentTermsDays: 'credit_terms', primaryContact: 'key_contact_name'
    },
    valueMaps: {
      entityType: {
        'Limited Company': 'corporation', 'LLP': 'llp', 'Partnership': 'partnership', 'Sole Trader': 'sole_proprietor'
      },
      status: { 'ACTIVE': 'active', 'DORMANT': 'inactive', 'SUSPENDED': 'pending' }
    }
  }
];

module.exports = { customerMappings };

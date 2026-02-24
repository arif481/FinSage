import { ChangeEvent } from 'react'
import { FinanceTransaction } from '@/types/finance'

interface CsvImportExportProps {
  disabled?: boolean
  transactions: FinanceTransaction[]
  onExport: (transactions: FinanceTransaction[]) => void
  onImport: (file: File) => Promise<void>
}

export const CsvImportExport = ({
  disabled,
  transactions,
  onExport,
  onImport,
}: CsvImportExportProps) => {
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? []

    if (!file) {
      return
    }

    void onImport(file)
  }

  return (
    <div className="card button-row">
      <label className="secondary-button" htmlFor="csv-import">
        Import CSV
      </label>
      <input
        accept=".csv,text/csv"
        disabled={disabled}
        id="csv-import"
        style={{ display: 'none' }}
        type="file"
        onChange={handleImport}
      />

      <button
        className="secondary-button"
        disabled={disabled || transactions.length === 0}
        type="button"
        onClick={() => onExport(transactions)}
      >
        Export CSV
      </button>
    </div>
  )
}

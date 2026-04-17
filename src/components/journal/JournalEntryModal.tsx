import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface Props { open: boolean; onClose: () => void; entryId?: string | null; }

export default function JournalEntryModal({ open, onClose, entryId }: Props) {
  const navigate = useNavigate();
  useEffect(() => {
    if (open) {
      onClose();
      navigate(entryId ? `/journal/${entryId}` : "/journal/new");
    }
  }, [open]);
  return null;
}

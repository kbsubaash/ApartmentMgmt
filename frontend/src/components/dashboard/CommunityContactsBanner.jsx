import { useEffect, useState } from 'react';
import { getContacts } from '@/api/communityContacts.api';

export default function CommunityContactsBanner() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContacts()
      .then(({ data }) => setContacts(data.contacts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (contacts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-900">📞 Community Contacts</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {contacts.map((c) => (
          <div
            key={c._id}
            className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-1">{c.icon || '📋'}</div>
            <p className="text-xs font-semibold text-gray-700 leading-tight">{c.category}</p>
            <p className="text-xs text-gray-500 truncate w-full text-center mt-0.5">{c.name}</p>
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="mt-1 text-xs font-bold text-brand hover:underline"
              >
                {c.phone}
              </a>
            )}
            {c.phone2 && (
              <a
                href={`tel:${c.phone2}`}
                className="text-xs text-gray-500 hover:underline"
              >
                {c.phone2}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

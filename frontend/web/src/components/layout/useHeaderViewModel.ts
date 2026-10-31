import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/view-models/useCurrentUser';
import { videoQueries } from '@/features/videos/model/video.queries';

export function useHeaderViewModel() {
  const navigate = useNavigate();
  const { me, isLoggedIn, balanceText } = useCurrentUser();
  const { data: categories } = useQuery(videoQueries.categories());
  const [keyword, setKeyword] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  return {
    displayName: me?.name || me?.email || '',
    isLoggedIn,
    balanceText,
    categories: categories ?? [],
    keyword,
    menuOpen,
    onKeywordChange: setKeyword,
    onToggleMenu: () => setMenuOpen((v) => !v),
    onCloseMenu: () => setMenuOpen(false),
    onSearch: (e: React.FormEvent) => {
      e.preventDefault();
      const q = keyword.trim();
      if (q) {
        setMenuOpen(false);
        navigate(`/tim-kiem?q=${encodeURIComponent(q)}`);
      }
    },
  };
}

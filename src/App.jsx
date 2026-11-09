import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  User,
  MessageSquare,
  Clock,
  Trash2,
  Heart,
  Database,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabase';

const INITIAL_FALLBACK_POSTS = [
  {
    id: 1,
    name: '관리자',
    message: 'Supabase 데이터베이스 연동 방명록에 오신 것을 환영합니다! 🎉\n.env에 프로젝트 정보를 입력하면 클라우드 DB와 실시간 연동됩니다.',
    likes: 5,
    created_at: new Date().toISOString()
  }
];

export default function App() {
  const [posts, setPosts] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 날짜 포맷 함수
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  // Supabase 방명록 목록 불러오기
  const fetchPosts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      // Supabase 미연동 시 로컬스토리지 또는 기본 데이터 표시
      const local = localStorage.getItem('guestbook_posts');
      setPosts(local ? JSON.parse(local) : INITIAL_FALLBACK_POSTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('방명록 조회 실패:', err);
      setErrorMessage('DB에서 방명록을 불러오는 중 오류가 발생했습니다. (테이블 생성 및 RLS 정책을 확인하세요)');
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드 & Realtime(실시간) 구독 설정
  useEffect(() => {
    fetchPosts();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('guestbook-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'guestbook' },
          () => {
            fetchPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchPosts]);

  // 글 작성
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) {
      alert('이름과 내용을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('guestbook')
          .insert([
            {
              name: name.trim(),
              message: message.trim(),
              likes: 0
            }
          ]);

        if (error) throw error;

        setName('');
        setMessage('');
        await fetchPosts();
      } catch (err) {
        console.error('글 작성 실패:', err);
        setErrorMessage('방명록 저장에 실패했습니다. Supabase 설정과 테이블 정책을 확인해주세요.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Supabase 미연동 모드 (미리보기 작동)
      const newPost = {
        id: Date.now(),
        name: name.trim(),
        message: message.trim(),
        likes: 0,
        created_at: new Date().toISOString()
      };
      const updated = [newPost, ...posts];
      setPosts(updated);
      localStorage.setItem('guestbook_posts', JSON.stringify(updated));
      setName('');
      setMessage('');
      setSubmitting(false);
    }
  };

  // 좋아요 증가
  const handleLike = async (post) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('guestbook')
          .update({ likes: (post.likes || 0) + 1 })
          .eq('id', post.id);

        if (error) throw error;
        await fetchPosts();
      } catch (err) {
        console.error('좋아요 실패:', err);
      }
    } else {
      const updated = posts.map((p) =>
        p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
      );
      setPosts(updated);
      localStorage.setItem('guestbook_posts', JSON.stringify(updated));
    }
  };

  // 글 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('이 방명록 글을 삭제하시겠습니까?')) return;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('guestbook')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchPosts();
      } catch (err) {
        console.error('글 삭제 실패:', err);
        alert('삭제에 실패했습니다. Supabase RLS 정책을 확인해주세요.');
      }
    } else {
      const updated = posts.filter((p) => p.id !== id);
      setPosts(updated);
      localStorage.setItem('guestbook_posts', JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Supabase 상태 배너 */}
        {!isSupabaseConfigured ? (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">⚠️ Supabase 클라우드 DB 연결 대기 중</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  프로젝트 루트의 <code>.env</code> 파일에 Supabase의 <strong>VITE_SUPABASE_URL</strong>과 <strong>VITE_SUPABASE_ANON_KEY</strong>를 입력하면 자동으로 클라우드 DB에 연결됩니다. (현재는 로컬 미리보기 모드로 동작 중입니다)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Supabase 클라우드 데이터베이스 연결됨</span>
            </div>
            <button
              onClick={fetchPosts}
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 transition px-2 py-1 rounded hover:bg-emerald-100"
              title="새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </button>
          </div>
        )}

        {/* 에러 메시지 알림 */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-xs">{errorMessage}</p>
          </div>
        )}

        {/* 헤더 / 제목 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            방명록
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            자유롭게 발자취를 남겨주세요.
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            총 {posts.length}개의 글
          </div>
        </div>

        {/* 메인 컨테이너 */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">

          {/* 입력 폼 영역 */}
          <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1.5">
                  이름 (Name)
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    maxLength={20}
                    disabled={submitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-1.5">
                  내용 (Message)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="따뜻한 메시지를 남겨보세요!"
                  rows={3}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      글 남기기
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 방명록 리스트 영역 */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm">방명록을 불러오는 중입니다...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>아직 작성된 방명록이 없습니다.</p>
                <p className="text-sm mt-1">첫 번째 글을 남겨보세요!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="p-6 sm:p-8 hover:bg-slate-50/50 transition">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <span className="font-bold text-slate-900 text-lg">
                      {post.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 whitespace-nowrap pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                    {post.message}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleLike(post)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-500 transition px-2 py-1 rounded-md hover:bg-rose-50 cursor-pointer"
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>좋아요 {post.likes || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-md hover:bg-red-50 cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

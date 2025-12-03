import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { exportTributes } from '../utils/exportUtils';

export default function TributeGallery() {
  const [tributes, setTributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTribute, setSelectedTribute] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTributes();
  }, []);

  const fetchTributes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('tributes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTributes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tributes:', err);
      setError(err.message || 'Unable to load tributes');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (tributes.length === 0) return;
    setIsExporting(true);
    try {
      await exportTributes(tributes, (progress) => {
        setExportProgress(progress);
      });
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const getImages = (tribute) => {
    const raw = tribute?.image_url;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      } catch (_) {
        /* fall through to return single url */
      }
      return [raw];
    }
    return [];
  };

  const filteredTributes = useMemo(() => {
    return tributes.filter((tribute) => {
      const images = getImages(tribute);
      if (filter === 'photo') return images.length > 0;
      // 'text' tab works like a guestbook: show every tribute
      return true;
    });
  }, [tributes, filter]);

  const photoCount = useMemo(
    () => tributes.filter((t) => getImages(t).length > 0).length,
    [tributes]
  );

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll('.tribute-card');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [filteredTributes]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)',
      fontFamily: "'Sarabun', sans-serif",
      color: '#5D5348'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&family=Mitr:wght@300;400;500&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          /* Header */
          .header {
            background: linear-gradient(180deg, #FAF8F5 0%, rgba(250, 248, 245, 0.95) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 40px 24px 32px;
            text-align: center;
            position: static; /* no sticky header */
            z-index: 1;
            border-bottom: 1px solid rgba(212, 175, 55, 0.15);
          }
          
          .header-inner {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .memorial-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%);
            padding: 8px 20px;
            border-radius: 30px;
            margin-bottom: 20px;
            border: 1px solid rgba(212, 175, 55, 0.2);
          }
          
          .memorial-badge span {
            font-size: 13px;
            color: #A08C5B;
            letter-spacing: 2px;
            font-weight: 500;
          }
          
          .header h1 {
            font-family: 'Mitr', sans-serif;
            font-size: 28px;
            font-weight: 400;
            color: #5D5348;
            margin-bottom: 6px;
            letter-spacing: 1px;
            margin-top: 0;
          }
          
          .header .nickname {
            font-size: 15px;
            color: #8B8178;
            font-weight: 300;
            margin-bottom: 16px;
            margin-top: 0;
          }
          
          .header .dates {
            font-size: 13px;
            color: #B8AFA4;
            margin: 0;
          }
          
          .stats {
            display: flex;
            justify-content: center;
            gap: 32px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(212, 175, 55, 0.15);
          }
          
          .stat-item {
            text-align: center;
          }
          
          .stat-number {
            font-family: 'Mitr', sans-serif;
            font-size: 24px;
            color: #D4AF37;
            font-weight: 400;
          }
          
          .stat-label {
            font-size: 12px;
            color: #B8AFA4;
            margin-top: 2px;
          }
          
          /* Add Button */
          .add-tribute-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
            border: none;
            cursor: pointer;
            box-shadow: 0 8px 30px rgba(212, 175, 55, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 100;
          }
          
          .add-tribute-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 12px 40px rgba(212, 175, 55, 0.5);
          }
          
          .add-tribute-btn svg {
            width: 28px;
            height: 28px;
            stroke: white;
            stroke-width: 2.5;
          }
          
          /* Main Content */
          .main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px 20px 100px;
          }
          
          /* Masonry Grid */
          .tribute-grid {
            column-count: 1;
            column-gap: 20px;
          }
          
          @media (min-width: 640px) {
            .tribute-grid {
              column-count: 2;
            }
          }
          
          @media (min-width: 1024px) {
            .tribute-grid {
              column-count: 3;
            }
          }
          
          /* Tribute Card */
          .tribute-card {
            break-inside: avoid;
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(212, 175, 55, 0.15);
            transition: all 0.4s ease;
            animation: fadeInUp 0.6s ease-out backwards;
            opacity: 0; /* Initially hidden for observer */
            transform: translateY(30px);
          }
          
          .tribute-card:hover {
            transform: translateY(-4px) !important; /* Override inline style from observer on hover */
            box-shadow: 0 20px 50px rgba(93, 83, 72, 0.12);
            border-color: rgba(212, 175, 55, 0.3);
          }
          
          .tribute-image {
            width: 100%;
            aspect-ratio: 4/3;
            object-fit: cover;
            display: block;
            background: linear-gradient(135deg, #F5F0E8 0%, #EDE6DB 100%);
            cursor: pointer;
          }
          
          .tribute-content {
            padding: 24px;
          }
          
          .tribute-message {
            font-size: 15px;
            line-height: 1.8;
            color: #5D5348;
            margin-bottom: 20px;
            font-weight: 300;
            white-space: pre-line;
          }
          
          .tribute-footer {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid rgba(212, 175, 55, 0.12);
          }
          
          .tribute-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Mitr', sans-serif;
            font-size: 16px;
            color: white;
            font-weight: 400;
            flex-shrink: 0;
          }
          
          .tribute-author {
            flex: 1;
            min-width: 0;
          }
          
          .tribute-name {
            font-weight: 500;
            font-size: 15px;
            color: #5D5348;
            margin-bottom: 2px;
          }
          
          .tribute-relation {
            font-size: 13px;
            color: #B8AFA4;
            font-weight: 300;
          }
          
          .tribute-date {
            font-size: 12px;
            color: #C9C0B3;
            text-align: right;
          }
          
          /* Quote Card (text only) */
          .tribute-card.quote-card {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%);
          }
          
          .tribute-card.quote-card .tribute-content {
            padding: 32px;
          }
          
          .tribute-card.quote-card .tribute-message {
            font-size: 18px;
            position: relative;
            padding-left: 24px;
          }
          
          .tribute-card.quote-card .tribute-message::before {
            content: '"';
            position: absolute;
            left: 0;
            top: -8px;
            font-family: 'Mitr', sans-serif;
            font-size: 48px;
            color: #D4AF37;
            opacity: 0.4;
            line-height: 1;
          }
          
          /* Filter Tabs */
          .filter-tabs {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 28px;
            flex-wrap: wrap;
          }
          
          .filter-tab {
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 400;
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(212, 175, 55, 0.2);
            color: #8B8178;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .filter-tab:hover {
            background: rgba(255, 255, 255, 0.9);
            border-color: rgba(212, 175, 55, 0.4);
          }
          
          .filter-tab.active {
            background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
            color: white;
            border-color: transparent;
          }
          
          /* Modal */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(93, 83, 72, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 200;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
          }
          
          .modal-content {
            background: #FAF8F5;
            border-radius: 24px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            animation: float 0.4s ease-out;
            position: relative;
          }
          
          .modal-image {
            width: 100%;
            max-height: 500px;
            object-fit: contain;
            background: #000;
            display: block;
          }
          
          .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 10;
          }
          
          .modal-close:hover {
            background: white;
            transform: scale(1.1);
          }
          
          .empty-state {
            text-align: center;
            padding: 80px 24px;
            animation: fadeIn 0.8s ease-out;
          }
          
          .empty-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 24px;
            border-radius: 50%;
            background: rgba(212, 175, 55, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: float 4s ease-in-out infinite;
          }
        `}
      </style>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="memorial-badge">
            <span>✦</span>
            <span>ด้วยรักและอาลัย</span>
            <span>✦</span>
          </div>

          <h1>รัส ปัทมะศังข์</h1>
          <p className="nickname">(กระบุง)</p>
          <p className="dates">วัดธาตุทอง พระอารามหลวง • ๑-๔ ธันวาคม ๒๕๖๘</p>

          <div className="stats">
            <div className="stat-item">
              <div className="stat-number">{tributes.length}</div>
              <div className="stat-label">ข้อความ</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{photoCount}</div>
              <div className="stat-label">รูปภาพ</div>
            </div>
          </div>

          {/* Export Button (Header) */}
          <button
            onClick={handleExport}
            disabled={isExporting || tributes.length === 0}
            title="Export Data"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#D4AF37',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            ทั้งหมด
          </button>
          <button
            className={`filter-tab ${filter === 'photo' ? 'active' : ''}`}
            onClick={() => setFilter('photo')}
          >
            มีรูปภาพ
          </button>
          <button
            className={`filter-tab ${filter === 'text' ? 'active' : ''}`}
            onClick={() => setFilter('text')}
          >
            ข้อความ
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" stroke="#D4AF37" fill="none" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
            <p style={{ color: '#B8AFA4' }}>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'rgba(220, 53, 69, 0.1)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" stroke="#dc3545" fill="none" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p style={{ color: '#dc3545' }}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTributes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" stroke="#D4AF37" fill="none" strokeWidth="1.5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Mitr', sans-serif", fontSize: '22px', color: '#5D5348', marginBottom: '8px', fontWeight: '400' }}>
              ยังไม่มีข้อความ
            </h3>
            <p style={{ fontSize: '15px', color: '#B8AFA4' }}>
              ร่วมเป็นคนแรกในการเขียนข้อความไว้อาลัย
            </p>
          </div>
        )}

        {/* Tribute Grid */}
        <div className="tribute-grid">
          {filteredTributes.map((tribute, index) => {
            const images = getImages(tribute);
            const hasImage = images.length > 0;
            const showImage = filter !== 'text' && hasImage;
            const isQuote = !showImage && (tribute.messages?.length < 100); // Simple heuristic for quote style

            return (
              <div
                key={tribute.id || index}
                className={`tribute-card ${isQuote ? 'quote-card' : ''}`}
              >
                {showImage && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getOptimizedImageUrl(images[0], 600)}
                      alt="Memory"
                      className="tribute-image"
                      loading="lazy"
                      decoding="async"
                      onClick={() => {
                        setSelectedImage(images[0]);
                        setSelectedTribute(tribute);
                      }}
                    />
                    {images.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backdropFilter: 'blur(4px)'
                      }}>
                        +{images.length - 1}
                      </div>
                    )}
                  </div>
                )}

                <div className="tribute-content">
                  <p className="tribute-message">
                    {tribute.messages || tribute.message}
                  </p>

                  <div className="tribute-footer">
                    <div className="tribute-avatar">
                      {tribute.name ? tribute.name.charAt(0) : '?'}
                    </div>
                    <div className="tribute-author">
                      <div className="tribute-name">{tribute.name || 'ไม่ระบุชื่อ'}</div>
                      {tribute.relationship && (
                        <div className="tribute-relation">{tribute.relationship}</div>
                      )}
                    </div>
                    <div className="tribute-date">
                      {formatDate(tribute.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Tribute Button */}
      <button
        className="add-tribute-btn"
        onClick={() => navigate('/')}
        title="เขียนข้อความ"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Export Progress Modal */}
      {isExporting && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-content" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" stroke="#28a745" fill="none" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Mitr', sans-serif", marginTop: '20px', color: '#5D5348' }}>กำลัง Export ข้อมูล</h3>
            <p style={{ color: '#8B8178', marginTop: '10px' }}>{exportProgress}</p>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5D5348" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Carousel Logic */}
            {(() => {
              const images = selectedTribute ? getImages(selectedTribute) : [selectedImage];
              const currentIndex = images.indexOf(selectedImage);

              const handlePrev = (e) => {
                e.stopPropagation();
                const newIndex = (currentIndex - 1 + images.length) % images.length;
                setSelectedImage(images[newIndex]);
              };

              const handleNext = (e) => {
                e.stopPropagation();
                const newIndex = (currentIndex + 1) % images.length;
                setSelectedImage(images[newIndex]);
              };

              return (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                  {images.length > 1 && (
                    <button
                      onClick={handlePrev}
                      style={{
                        position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', cursor: 'pointer', zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}
                    >
                      ❮
                    </button>
                  )}

                  <img
                    src={getOptimizedImageUrl(selectedImage, 1200)}
                    alt="Full size"
                    className="modal-image"
                    style={{ maxHeight: '80vh' }}
                  />

                  {images.length > 1 && (
                    <button
                      onClick={handleNext}
                      style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', cursor: 'pointer', zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}
                    >
                      ❯
                    </button>
                  )}

                  {images.length > 1 && (
                    <div style={{
                      position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px'
                    }}>
                      {currentIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
              );
            })()}

            {selectedTribute && (
              <div style={{ padding: '24px' }}>
                <p className="tribute-message" style={{ fontSize: '16px' }}>
                  {selectedTribute.messages || selectedTribute.message}
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
                  <div className="tribute-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                    {selectedTribute.name ? selectedTribute.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <div className="tribute-name" style={{ fontSize: '14px' }}>{selectedTribute.name}</div>
                    <div className="tribute-relation" style={{ fontSize: '12px' }}>{selectedTribute.relationship}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

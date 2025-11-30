import React, { useState, useRef } from 'react';

import { supabase } from '../lib/supabase';

export default function MemorialTribute() {
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    message: '',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData({ ...formData, images: files });

      const newPreviews = [];
      let loadedCount = 0;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          loadedCount++;
          if (loadedCount === files.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    if (newImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrls = [];
      let imageUrl = null; // Keep for backward compatibility if needed, or just use the first one

      // Upload images to Cloudinary if exists
      if (formData.images && formData.images.length > 0) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          throw new Error('Cloudinary configuration is missing');
        }

        const uploadPromises = formData.images.map(async (file) => {
          const data = new FormData();
          data.append('file', file);
          data.append('upload_preset', uploadPreset);
          data.append('folder', 'bung');

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: data,
            }
          );

          if (!response.ok) {
            throw new Error('Image upload failed');
          }

          const result = await response.json();
          return result.secure_url;
        });

        imageUrls = await Promise.all(uploadPromises);
        console.log('Uploaded Image URLs:', imageUrls);

        // Use JSON string to store multiple URLs in the text column
        imageUrl = JSON.stringify(imageUrls);
      }

      // Save to Supabase
      const { error } = await supabase
        .from('tributes')
        .insert([
          {
            name: formData.name,
            relationship: formData.relationship,
            messages: formData.message,
            image_url: imageUrl
          }
        ]);

      if (error) {
        throw error;
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message);
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 50%, #EDE6DB 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Sarabun', sans-serif"
      }}>
        <style>
          {`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes floatIn {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes gentlePulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}
        </style>

        <div style={{
          textAlign: 'center',
          animation: 'fadeInUp 0.8s ease-out',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'floatIn 0.6s ease-out',
            boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)'
          }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 style={{
            fontFamily: "'Mitr', sans-serif",
            fontSize: '28px',
            color: '#5D5348',
            marginBottom: '16px',
            fontWeight: '400'
          }}>
            ขอบคุณสำหรับข้อความ
          </h2>

          <p style={{
            color: '#8B8178',
            fontSize: '16px',
            lineHeight: '1.8',
            fontWeight: '300'
          }}>
            ข้อความของท่านจะถูกส่งต่อให้ครอบครัว<br />
            ขอบคุณที่ร่วมแสดงความอาลัย
          </p>

          <div style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#D4AF37',
                animation: 'gentlePulse 2s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 50%, #EDE6DB 100%)',
      fontFamily: "'Sarabun', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>
        {`
          * {
            box-sizing: border-box;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .memorial-input {
            width: 100%;
            padding: 16px 20px;
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 12px;
            font-size: 16px;
            font-family: 'Sarabun', sans-serif;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            color: #5D5348;
          }
          
          .memorial-input:focus {
            outline: none;
            border-color: #D4AF37;
            box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
            background: rgba(255, 255, 255, 0.9);
          }
          
          .memorial-input::placeholder {
            color: #B8AFA4;
          }
          
          .submit-btn {
            width: 100%;
            padding: 18px 32px;
            background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            font-family: 'Mitr', sans-serif;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
          }
          
          .submit-btn:active:not(:disabled) {
            transform: translateY(0);
          }
          
          .submit-btn:disabled {
            background: linear-gradient(135deg, #C9C0B3 0%, #B8AFA4 100%);
            cursor: not-allowed;
          }
          
          .upload-area {
            border: 2px dashed rgba(212, 175, 55, 0.4);
            border-radius: 16px;
            padding: 30px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.5);
          }
          
          .upload-area:hover {
            border-color: #D4AF37;
            background: rgba(255, 255, 255, 0.8);
          }
        `}
      </style>

      {/* Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-30px',
        left: '-30px',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
        animationDelay: '-2s'
      }} />

      {/* Main Content */}
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: '40px 24px 60px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          animation: 'fadeIn 0.8s ease-out'
        }}>
          {/* Decorative Line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '60px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #D4AF37)'
            }} />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L14.5 8.5L21 9.5L16.5 14L17.5 21L12 18L6.5 21L7.5 14L3 9.5L9.5 8.5L12 3Z"
                fill="#D4AF37" opacity="0.6" />
            </svg>
            <div style={{
              width: '60px',
              height: '1px',
              background: 'linear-gradient(90deg, #D4AF37, transparent)'
            }} />
          </div>

          <p style={{
            fontSize: '14px',
            color: '#B8AFA4',
            letterSpacing: '4px',
            marginBottom: '12px',
            fontWeight: '300'
          }}>
            ด้วยรักและอาลัย
          </p>

          <h1 style={{
            fontFamily: "'Mitr', sans-serif",
            fontSize: '32px',
            color: '#5D5348',
            marginBottom: '8px',
            fontWeight: '400',
            letterSpacing: '2px'
          }}>
            รัส ปัทมะศังข์
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#8B8178',
            fontWeight: '300'
          }}>
            (กระบุง)
          </p>

          {/* Decorative Flower */}
          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            opacity: '0.5'
          }}>
            <span style={{ fontSize: '20px' }}>✿</span>
            <span style={{ fontSize: '16px' }}>❀</span>
            <span style={{ fontSize: '20px' }}>✿</span>
          </div>
        </div>

        {/* Introduction Text */}
        <p style={{
          textAlign: 'center',
          color: '#8B8178',
          fontSize: '15px',
          lineHeight: '1.8',
          marginBottom: '36px',
          animation: 'fadeIn 0.8s ease-out',
          animationDelay: '0.2s',
          animationFillMode: 'backwards'
        }}>
          ร่วมบันทึกความทรงจำและความดีงาม<br />
          ที่มีต่อผู้ล่วงลับ
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          animation: 'fadeIn 0.8s ease-out',
          animationDelay: '0.4s',
          animationFillMode: 'backwards'
        }}>
          {/* Name Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#8B8178',
              fontWeight: '500'
            }}>
              ชื่อผู้เขียน
            </label>
            <input
              type="text"
              className="memorial-input"
              placeholder="กรุณาระบุชื่อของท่าน"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Relationship Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#8B8178',
              fontWeight: '500'
            }}>
              ความสัมพันธ์ <span style={{ color: '#B8AFA4' }}>(ไม่บังคับ)</span>
            </label>
            <input
              type="text"
              className="memorial-input"
              placeholder="เช่น เพื่อน, ญาติ, เพื่อนร่วมงาน"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            />
          </div>

          {/* Message Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#8B8178',
              fontWeight: '500'
            }}>
              ข้อความ
            </label>
            <textarea
              className="memorial-input"
              placeholder="เขียนความทรงจำ หรือความดีงามที่มีต่อผู้ล่วงลับ..."
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              style={{ resize: 'vertical', minHeight: '140px' }}
            />
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#8B8178',
              fontWeight: '500'
            }}>
              แนบรูปภาพ
            </label>

            {imagePreviews.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '10px',
                marginBottom: '10px'
              }}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#fff',
                    aspectRatio: '1'
                  }}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {/* Always show upload button to allow adding more images */}
                <label className="upload-area" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  minHeight: '100px',
                  border: '2px dashed rgba(212, 175, 55, 0.4)',
                  borderRadius: '12px'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </label>
              </div>
            ) : (
              <label className="upload-area" style={{ display: 'block' }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '60px',
                  height: '60px',
                  
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <p style={{
                  color: '#8B8178',
                  fontSize: '15px',
                  marginBottom: '4px'
                }}>
                  แตะเพื่อเลือกรูปภาพ
                </p>
              </label>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || !formData.name || !formData.message}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{
                  animation: 'spin 1s linear infinite'
                }}>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" />
                </svg>
                กำลังส่ง...
              </span>
            ) : (
              'ส่งข้อความ'
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#B8AFA4',
            lineHeight: '1.6'
          }}>
            วัดธาตุทอง พระอารามหลวง<br />
            ๑-๔ ธันวาคม ๒๕๖๘
          </p>
        </div>
      </div>
    </div>
  );
}

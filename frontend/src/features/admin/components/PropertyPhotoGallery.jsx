import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, Typography, useMediaQuery,
} from '@mui/material';
import { ArrowBackRounded, ArrowForwardRounded, CloseRounded, GridViewRounded, ImageNotSupportedOutlined } from '@mui/icons-material';
import { getPropertyMediaUrl } from '../utils/propertyDetails.js';

function PropertyImage({ source, label, contain = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);
  const src = getPropertyMediaUrl(source);
  if (!src || failed) {
    return (
      <Stack role="img" aria-label={`${label}: không tải được ảnh`} alignItems="center" justifyContent="center"
        sx={{ width: '100%', height: '100%', minHeight: 60, bgcolor: 'action.hover', color: 'text.secondary' }}>
        <ImageNotSupportedOutlined aria-hidden="true" />
      </Stack>
    );
  }
  return <Box component="img" src={src} alt={label} onError={() => setFailed(true)}
    sx={{ width: '100%', height: '100%', objectFit: contain ? 'contain' : 'cover', display: 'block' }} />;
}

PropertyImage.propTypes = { source: PropTypes.string, label: PropTypes.string.isRequired, contain: PropTypes.bool };

export default function PropertyPhotoGallery({ images, title }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const photos = images.filter((source) => typeof source === 'string' && source.trim());
  const count = Math.min(photos.length, 5);
  const movePhoto = (direction) => setActiveIndex((index) => (index + direction + photos.length) % photos.length);

  if (!photos.length) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={1}
        sx={{ minHeight: 220, borderRadius: 2.5, bgcolor: 'action.hover', color: 'text.secondary' }}>
        <ImageNotSupportedOutlined sx={{ fontSize: 40 }} aria-hidden="true" />
        <Typography>Chỗ ở chưa có hình ảnh</Typography>
      </Stack>
    );
  }

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          display: 'grid', gap: 1, overflow: 'hidden', borderRadius: 2.5,
          height: { xs: 220, sm: 300, lg: 340 },
          gridTemplateColumns: { xs: '1fr', sm: count <= 2 ? `repeat(${count}, 1fr)` : count === 3 ? '2fr 1fr' : '2fr 1fr 1fr' },
          gridTemplateRows: { xs: '1fr', sm: count > 2 ? 'repeat(2, minmax(0, 1fr))' : '1fr' },
        }}>
          {photos.slice(0, 5).map((source, index) => (
            <ButtonBase key={`${source}-${index}`} onClick={() => setActiveIndex(index)}
              aria-label={`Xem ảnh ${index + 1} của ${title}`}
              sx={{
                minWidth: 0, minHeight: 0, display: { xs: index === 0 ? 'flex' : 'none', sm: 'flex' },
                gridRow: { sm: index === 0 && count > 2 ? 'span 2' : 'auto' },
                gridColumn: { sm: count === 4 && index === 3 ? 'span 2' : 'auto' },
                '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: -4 },
                '&:hover img': { filter: 'brightness(0.92)' },
              }}>
              <PropertyImage source={source} label={`${title} — ảnh ${index + 1}`} />
            </ButtonBase>
          ))}
        </Box>
        <Button variant="contained" color="inherit" startIcon={<GridViewRounded />} onClick={() => setActiveIndex(0)}
          sx={{ position: 'absolute', right: { xs: 12, sm: 16 }, bottom: { xs: 12, sm: 16 }, minHeight: 44,
            bgcolor: 'background.paper', color: 'text.primary', '&:hover': { bgcolor: 'background.default' } }}>
          Hiển thị tất cả {photos.length} ảnh
        </Button>
      </Box>

      <Dialog fullScreen open={activeIndex !== null} onClose={() => setActiveIndex(null)}
        aria-labelledby="property-photos-title" transitionDuration={reducedMotion ? 0 : undefined}
        sx={{ '& .MuiDialog-paperFullScreen': { m: 0, width: '100%', maxHeight: '100%' } }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}>
        <DialogTitle id="property-photos-title" sx={{ pr: 8, overflowWrap: 'anywhere' }}>
          {title}
          <IconButton aria-label="Đóng bộ ảnh" onClick={() => setActiveIndex(null)}
            sx={{ position: 'absolute', right: 12, top: 12, width: 44, height: 44 }}><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          {activeIndex !== null && <PropertyImage source={photos[activeIndex]} label={`${title} — ảnh ${activeIndex + 1}`} contain />}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1.5, '& > :not(:first-of-type)': { ml: 0 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton aria-label="Ảnh trước" disabled={photos.length < 2} onClick={() => movePhoto(-1)} sx={{ width: 44, height: 44 }}><ArrowBackRounded /></IconButton>
            <Typography aria-live="polite" sx={{ minWidth: 90, textAlign: 'center' }}>Ảnh {(activeIndex ?? 0) + 1} / {photos.length}</Typography>
            <IconButton aria-label="Ảnh tiếp theo" disabled={photos.length < 2} onClick={() => movePhoto(1)} sx={{ width: 44, height: 44 }}><ArrowForwardRounded /></IconButton>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ maxWidth: '100%', overflowX: 'auto', p: 0.5 }}>
            {photos.map((source, index) => (
              <ButtonBase key={`${source}-${index}`} aria-label={`Chọn ảnh ${index + 1}`} aria-pressed={activeIndex === index}
                onClick={() => setActiveIndex(index)} sx={{ width: 64, height: 52, flexShrink: 0, borderRadius: 1,
                  overflow: 'hidden', border: '2px solid', borderColor: activeIndex === index ? 'primary.main' : 'transparent' }}>
                <PropertyImage source={source} label={`Ảnh thu nhỏ ${index + 1}`} />
              </ButtonBase>
            ))}
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

PropertyPhotoGallery.propTypes = { images: PropTypes.arrayOf(PropTypes.string).isRequired, title: PropTypes.string.isRequired };

import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function AboutThisPlace({ description, title }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const headingId = useId();
  const contentId = useId();
  const text = description?.trim() || 'Chủ nhà chưa cập nhật phần giới thiệu chỗ ở.';
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const isLong = text.length > 260 || text.split('\n').length > 4;

  return (
    <Box sx={{ my: 3.5 }}>
      <Typography component="h2" variant="h6" sx={{ mb: 1.5, fontWeight: 750 }}>
        Giới thiệu về chỗ ở này
      </Typography>
      <Typography color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line', overflowWrap: 'anywhere',
        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {text}
      </Typography>
      {isLong && (
        <Button onClick={() => setOpen(true)} endIcon={<ArrowForwardRoundedIcon />}
          aria-haspopup="dialog" sx={{ mt: 1.5, minHeight: 44, fontWeight: 700, px: 0.5 }}>
          Xem thêm chi tiết
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" fullScreen={fullScreen}
        aria-labelledby={headingId} aria-describedby={contentId}
        transitionDuration={reducedMotion ? 0 : undefined}
        sx={{ '& .MuiDialog-paperFullScreen': { m: 0, width: '100%', maxWidth: '100%', height: '100%', maxHeight: '100%', borderRadius: 0 } }}
        PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3, bgcolor: 'background.paper',
          color: 'text.primary', maxHeight: fullScreen ? '100%' : 'calc(100% - 48px)' } }}>
        <DialogTitle component="div" sx={{ px: { xs: 2.5, sm: 4 }, pt: 3, pb: 2.5, borderBottom: 1, borderColor: 'divider', position: 'relative', pr: { xs: 8, sm: 9 } }}>
          <Typography id={headingId} component="h2" variant="h5" sx={{ fontWeight: 750, lineHeight: 1.35 }}>
            Giới thiệu về chỗ ở này
          </Typography>
          {title && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>{title}</Typography>}
          <IconButton autoFocus aria-label="Đóng giới thiệu" onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: { xs: 12, sm: 20 }, top: 16, width: 44, height: 44, bgcolor: 'action.hover' }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: 3, '&.MuiDialogContent-root': { pt: 3 } }}>
          <Stack id={contentId} gap={2.5} sx={{ maxWidth: '65ch' }}>
            {paragraphs.map((paragraph, index) => (
              <Typography key={index} sx={{ lineHeight: 1.9, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{paragraph}</Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button variant="contained" onClick={() => setOpen(false)} sx={{ minHeight: 44, px: 3 }}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

AboutThisPlace.propTypes = { description: PropTypes.string, title: PropTypes.string };

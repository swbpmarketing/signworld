const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DC_ID = '1460585326975385659';

console.log('[Discord] Webhook URL configured:', WEBHOOK_URL ? 'Yes' : 'No (DISCORD_WEBHOOK_URL not set)');

const COLORS = {
  bug: 0xE74C3C,
  feature: 0x3498DB,
};

const STATUS_COLORS = {
  pending: 0xF1C40F,
  in_progress: 0xE67E22,
  completed: 0x2ECC71,
  rejected: 0xE74C3C,
  qa: 0x9B59B6,
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
  qa: 'QA',
};

function truncate(str, max = 200) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

async function sendWebhook(payload) {
  if (!WEBHOOK_URL) {
    console.warn('[Discord] Skipping webhook — no DISCORD_WEBHOOK_URL set');
    return;
  }
  try {
    console.log('[Discord] Sending webhook...');
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[Discord] Webhook response:', res.status, res.statusText);
    if (!res.ok) {
      const body = await res.text();
      console.error('[Discord] Webhook error body:', body);
    }
  } catch (err) {
    console.error('[Discord] Webhook error:', err.message);
  }
}

function sendBugReportCreated(report) {
  const type = report.type || 'bug';
  const authorName = report.author?.name || 'Unknown';
  const priority = (report.priority || 'medium').charAt(0).toUpperCase() + (report.priority || 'medium').slice(1);

  sendWebhook({
    content: `<@${DC_ID}> New ${type === 'bug' ? 'bug report' : 'feature request'} submitted!`,
    embeds: [{
      title: `New ${type === 'bug' ? 'Bug Report' : 'Feature Request'}: ${truncate(report.title, 100)}`,
      description: truncate(report.description, 500),
      color: COLORS[type] || COLORS.bug,
      fields: [
        { name: 'Type', value: type === 'bug' ? 'Bug' : 'Feature', inline: true },
        { name: 'Priority', value: priority, inline: true },
        { name: 'Status', value: 'Pending', inline: true },
        { name: 'Author', value: authorName, inline: true },
        ...(report.stepsToReproduce ? [{ name: 'Steps to Reproduce', value: truncate(report.stepsToReproduce, 300) }] : []),
        ...(report.expectedBehavior ? [{ name: 'Expected Behavior', value: truncate(report.expectedBehavior, 300) }] : []),
        ...(report.actualBehavior ? [{ name: 'Actual Behavior', value: truncate(report.actualBehavior, 300) }] : []),
      ],
      footer: { text: `Task ${report.taskNumber || ''}` },
      timestamp: new Date().toISOString(),
    }],
  });
}

function sendBugReportStatusChanged(report, previousStatus, newStatus, changedBy) {
  const type = report.type || 'bug';
  const changedByName = changedBy?.name || 'Unknown';

  sendWebhook({
    content: `<@${DC_ID}> Status updated on ${type === 'bug' ? 'bug report' : 'feature request'}: **${truncate(report.title, 80)}**`,
    embeds: [{
      title: `Status Updated: ${truncate(report.title, 100)}`,
      description: truncate(report.description, 300),
      color: STATUS_COLORS[newStatus] || 0x95A5A6,
      fields: [
        { name: 'From', value: STATUS_LABELS[previousStatus] || previousStatus, inline: true },
        { name: 'To', value: STATUS_LABELS[newStatus] || newStatus, inline: true },
        { name: 'Type', value: type === 'bug' ? 'Bug' : 'Feature', inline: true },
        { name: 'Changed By', value: changedByName, inline: true },
        ...(report.adminNotes ? [{ name: 'Admin Notes', value: truncate(report.adminNotes, 300) }] : []),
      ],
      footer: { text: `Task ${report.taskNumber || ''}` },
      timestamp: new Date().toISOString(),
    }],
  });
}

function sendBugReportComment(report, comment, commenter) {
  const type = report.type || 'bug';
  const commenterName = commenter?.name || comment?.user?.name || 'Unknown';
  const commentText = comment?.text || '';

  sendWebhook({
    content: `<@${DC_ID}> New comment on ${type === 'bug' ? 'bug report' : 'feature request'}: **${truncate(report.title, 80)}**`,
    embeds: [{
      title: `New Comment on: ${truncate(report.title, 100)}`,
      description: truncate(commentText, 500),
      color: COLORS[type] || COLORS.bug,
      fields: [
        { name: 'Comment By', value: commenterName, inline: true },
        { name: 'Type', value: type === 'bug' ? 'Bug' : 'Feature', inline: true },
        { name: 'Status', value: STATUS_LABELS[report.status] || report.status, inline: true },
      ],
      footer: { text: `Task ${report.taskNumber || ''}` },
      timestamp: new Date().toISOString(),
    }],
  });
}

module.exports = {
  sendBugReportCreated,
  sendBugReportStatusChanged,
  sendBugReportComment,
};

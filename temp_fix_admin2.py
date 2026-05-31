from pathlib import Path
path = Path(r'e:\STS Gold and silvers\src\pages\AdminDashboard.jsx')
text = path.read_text(encoding='utf-8')
start = '  const handleNotificationInsert = (notification) => {'
end = '  const handleNotificationPanelEvent = async () => {\n    await handleNotificationBellClick();\n  };\n    const { data, error } = await supabase.from("metal_rates").select("*");\n'
idx = text.find(start)
idx2 = text.find(end, idx)
if idx == -1 or idx2 == -1:
    raise RuntimeError('Markers not found for the second replacement')
# include the end marker so we remove it too and preserve only fetchMetalRate below
idx2 += len(end)
new_block = r'''
  const notifyAdminEvent = async ({ title, message, type, payload }) => {
    try {
      const notification = await createNotification({ title, message, type, payload });
      handleNotificationInsert(notification);
      return notification;
    } catch (error) {
      console.error('Failed to create admin notification:', error);
      return null;
    }
  };

  const markOrderNotificationsRead = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('type', 'order')
        .eq('is_read', false)
        .select();

      if (error) {
        console.error('markOrderNotificationsRead error:', error);
        return;
      }

      setNotifications((current) => {
        const updated = current.map((item) =>
          item.type === 'order' ? { ...item, is_read: true } : item
        );
        setUnreadCount(updated.filter((item) => !item.is_read).length);
        return updated;
      });
    } catch (error) {
      console.error('markOrderNotificationsRead exception:', error);
    }
  };

  const markAllNotificationsReadLocal = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('markAllNotificationsReadLocal failed:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications((current) => {
        const updated = current.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        );
        setUnreadCount(updated.filter((item) => !item.is_read).length);
        return updated;
      });
    } catch (error) {
      console.error('handleMarkAsRead failed:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setPopupNotifications([]);
    } catch (error) {
      console.error('handleClearAllNotifications failed:', error);
    }
  };

  const toggleNotificationPanel = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    notificationsOpenRef.current = nextOpen;

    if (nextOpen) {
      await markAllNotificationsReadLocal();
    }
  };

  const selectNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '🛒';
      case 'custom':
        return '🎨';
      case 'stock':
        return '⚠';
      default:
        return '🔔';
    }
  };

  const formatNotificationTime = (dateString) => {
    const time = dateString ? new Date(dateString) : new Date();
    return `${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${time.toLocaleDateString()}`;
  };

  const handleLowStockNotification = async (product) => {
    if (!product?.id) return;

    const stockCount = Number(product.stock_qty ?? product.stock ?? 0);
    if (stockCount > 5) return;
    if (lowStockNotified.current.has(product.id)) return;

    lowStockNotified.current.add(product.id);

    await notifyAdminEvent({
      title: '⚠ Low Stock Alert',
      message: `${product.name || 'Item'} is low on stock (${stockCount} remaining).`,
      type: 'stock',
      payload: {
        product_id: product.id,
        stock_qty: stockCount,
      },
    });
  };

  const handleProductChangeEvent = async (payload) => {
    const newProduct = payload?.new;
    const oldProduct = payload?.old;
    if (!newProduct) return;

    const newStock = Number(newProduct.stock_qty ?? newProduct.stock ?? 0);
    const oldStock = Number(oldProduct?.stock_qty ?? oldProduct?.stock ?? 0);

    if (newStock <= 5 && oldStock > 5) {
      await handleLowStockNotification(newProduct);
    }
  };

  const handleNewOrderNotification = async (order) => {
    if (!order) return;

    await notifyAdminEvent({
      title: '🛒 New Order Received',
      message: `Customer: ${order.customer_name || 'Unknown'} · Amount: ₹${Number(
        order.final_total || order.total || order.price || 0
      ).toLocaleString()} · ${order.product_name || 'New product order'}`,
      type: 'order',
      payload: {
        order_id: order.id,
        customer_name: order.customer_name,
        amount: Number(order.final_total || order.total || order.price || 0),
      },
    });

    if (activeTabRef.current === 'orders') {
      await markOrderNotificationsRead();
      fetchOrders();
    }
  };

  const handleNewCustomRequestNotification = async (request) => {
    if (!request) return;

    await notifyAdminEvent({
      title: '🎨 New Custom Design Request',
      message: `Request from ${request.customer_name || request.customer_email || 'a client'}.`,
      type: 'custom',
      payload: {
        request_id: request.id,
      },
    });
  };

  const handleRealtimeOrderEvent = async (payload) => {
    if (!payload?.new) return;
    await handleNewOrderNotification(payload.new);
  };

  const handleRealtimeCustomEvent = async (payload) => {
    if (!payload?.new) return;
    await handleNewCustomRequestNotification(payload.new);
  };

  const handleRealtimeNotificationsEvent = (payload) => {
    if (!payload?.new) return;
    handleNotificationInsert(payload.new);
  };

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase.from('metal_rates').select('*');
      if (error) {
        console.log(error);
        return;
      }

      const goldRate = data.find((r) => r.metal_type === 'gold')?.rate || 0;
      const silverRate = data.find((r) => r.metal_type === 'silver')?.rate || 0;

      setRates({ gold: goldRate, silver: silverRate });
      setGoldRate(goldRate);
      setSilverRate(silverRate);
    } catch (error) {
      console.error('fetchRates error:', error);
    }
  };
'''
path.write_text(text[:idx] + new_block + text[idx2:], encoding='utf-8')
print('Replaced notification block successfully')

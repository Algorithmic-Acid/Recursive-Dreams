import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import OrderRepository from '../repositories/OrderRepository';
import ProductRepository from '../repositories/ProductRepository';
import { protect, admin } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// Create new order (Protected)
router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('shippingAddress.address').trim().notEmpty().withMessage('Address is required'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
    body('shippingAddress.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { items, shippingAddress, paymentMethod } = req.body;

      // Fetch product details and validate stock
      const orderItems = [];
      let total = 0;

      for (const item of items) {
        const product = await ProductRepository.findById(item.productId);

        if (!product) {
          const response: ApiResponse = {
            success: false,
            error: `Product not found: ${item.productId}`,
          };
          return res.status(404).json(response);
        }

        if (product.stock < item.quantity) {
          const response: ApiResponse = {
            success: false,
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          };
          return res.status(400).json(response);
        }

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          product,
        });

        total += product.price * item.quantity;
      }

      // Create order (stock will be deducted in repository)
      const order = await OrderRepository.create({
        userId: req.user!.userId,
        items: orderItems,
        total,
        shippingAddress,
        paymentMethod: paymentMethod || 'card',
      });

      const response: ApiResponse = {
        success: true,
        data: order,
        message: 'Order created successfully',
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Create order error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create order',
      };
      res.status(500).json(response);
    }
  }
);

// Get user's orders (Protected)
router.get('/my-orders', protect, async (req: Request, res: Response) => {
  try {
    const orders = await OrderRepository.findByUserId(req.user!.userId);

    const response: ApiResponse = {
      success: true,
      data: orders,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get orders error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch orders',
    };
    res.status(500).json(response);
  }
});

// Get single order (Protected)
router.get('/:id', protect, async (req: Request, res: Response) => {
  try {
    const order = await OrderRepository.findById(req.params.id);

    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Order not found',
      };
      return res.status(404).json(response);
    }

    // Ensure user can only access their own orders (unless admin)
    if (
      order.userId !== req.user!.userId &&
      req.user!.role !== 'admin'
    ) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized to access this order',
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: order,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get order error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch order',
    };
    res.status(500).json(response);
  }
});

// Update order status (Admin only)
router.patch(
  '/:id/status',
  protect,
  admin,
  [
    body('status')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: errors.array()[0].msg,
        };
        return res.status(400).json(response);
      }

      const { status, trackingNumber } = req.body;

      let order = await OrderRepository.updateStatus(req.params.id, status);

      if (!order) {
        const response: ApiResponse = {
          success: false,
          error: 'Order not found',
        };
        return res.status(404).json(response);
      }

      if (trackingNumber) {
        order = await OrderRepository.updateTrackingNumber(req.params.id, trackingNumber) || order;
      }

      const response: ApiResponse = {
        success: true,
        data: order,
        message: 'Order status updated successfully',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Update order status error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update order status',
      };
      res.status(500).json(response);
    }
  }
);

// Get all orders (Admin only)
router.get('/', protect, admin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const orders = status && typeof status === 'string'
      ? await OrderRepository.findByStatus(status)
      : await OrderRepository.findAll();

    const response: ApiResponse = {
      success: true,
      data: orders,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get all orders error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch orders',
    };
    res.status(500).json(response);
  }
});

// Cancel order (Protected)
router.patch('/:id/cancel', protect, async (req: Request, res: Response) => {
  try {
    const order = await OrderRepository.findById(req.params.id);

    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Order not found',
      };
      return res.status(404).json(response);
    }

    // Ensure user can only cancel their own orders
    if (order.userId !== req.user!.userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized to cancel this order',
      };
      return res.status(403).json(response);
    }

    // Can only cancel pending or processing orders
    if (!['pending', 'processing'].includes(order.status)) {
      const response: ApiResponse = {
        success: false,
        error: `Cannot cancel order with status: ${order.status}`,
      };
      return res.status(400).json(response);
    }

    const updatedOrder = await OrderRepository.updateStatus(req.params.id, 'cancelled');

    // Restore product stock
    for (const item of order.items) {
      await ProductRepository.updateStock(item.productId, item.quantity);
    }

    const response: ApiResponse = {
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully',
    };

    res.json(response);
  } catch (error: any) {
    console.error('Cancel order error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to cancel order',
    };
    res.status(500).json(response);
  }
});

export default router;

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import OrderModel from '../models/Order';
import ProductModel from '../models/ProductModel.mongoose';
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

      const { items, shippingAddress, paymentMethod, notes } = req.body;

      // Fetch product details and validate stock
      const orderItems = [];
      let total = 0;

      for (const item of items) {
        const product = await ProductModel.findById(item.productId);

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
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          icon: product.icon,
        });

        total += product.price * item.quantity;

        // Update product stock
        product.stock -= item.quantity;
        await product.save();
      }

      // Create order
      const order = await OrderModel.create({
        userId: req.user!.userId,
        items: orderItems,
        total,
        shippingAddress,
        paymentMethod: paymentMethod || 'card',
        notes,
      });

      const response: ApiResponse = {
        success: true,
        data: order.toJSON(),
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
    const orders = await OrderModel.find({ userId: req.user!.userId }).sort({
      createdAt: -1,
    });

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
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Order not found',
      };
      return res.status(404).json(response);
    }

    // Ensure user can only access their own orders (unless admin)
    if (
      order.userId.toString() !== req.user!.userId &&
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
      data: order.toJSON(),
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

      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        const response: ApiResponse = {
          success: false,
          error: 'Order not found',
        };
        return res.status(404).json(response);
      }

      order.status = status;
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      await order.save();

      const response: ApiResponse = {
        success: true,
        data: order.toJSON(),
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
    const { status, limit = 50, page = 1 } = req.query;

    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip)
      .populate('userId', 'name email');

    const total = await OrderModel.countDocuments(query);

    const response: ApiResponse = {
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
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
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Order not found',
      };
      return res.status(404).json(response);
    }

    // Ensure user can only cancel their own orders
    if (order.userId.toString() !== req.user!.userId) {
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

    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      const product = await ProductModel.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    const response: ApiResponse = {
      success: true,
      data: order.toJSON(),
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

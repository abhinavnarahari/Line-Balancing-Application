package com.qtech.linebalancing.order.entity;

import com.qtech.linebalancing.size.entity.Size;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_size_lines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderSizeLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "size_id", nullable = false)
    private Size size;

    @Column(nullable = false)
    private Integer quantity;
}

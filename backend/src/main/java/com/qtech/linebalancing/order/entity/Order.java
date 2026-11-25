package com.qtech.linebalancing.order.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.style.entity.Style;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order extends AuditableEntity {

    /** Optimistic-lock counter; incremented by JPA on every update. */
    @Version
    @Column(name = "row_version", nullable = false)
    @Builder.Default
    private Long rowVersion = 0L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, unique = true, length = 50)
    private String orderNo;

    /** Optional. */
    @Column(length = 150)
    private String buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "style_id", nullable = false)
    private Style style;

    /** The colour (single-colour order) or a summary of the colours (multi-colour order); each size line has its own. */
    @Column(nullable = false, length = 100)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    @Builder.Default
    private OrderType orderType = OrderType.SINGLE_COLOR;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "planned_completion_date")
    private LocalDate plannedCompletionDate;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PLANNED;

    /** Calculated = SUM of all size line quantities. Updated by service on save. */
    @Column(name = "total_quantity", nullable = false)
    @Builder.Default
    private Integer totalQuantity = 0;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderSizeLine> sizeLines = new ArrayList<>();

    /** SINGLE_COLOR: one colour, several sizes. MULTI_COLOR: several colours, each with its sizes. */
    public enum OrderType {
        SINGLE_COLOR, MULTI_COLOR
    }

    public enum Status {
        PLANNED, IN_PRODUCTION, COMPLETED, ON_HOLD
    }
}
